import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { generateToken, authMiddleware, roleGuard } from './auth';

describe('Auth Middleware & Helpers', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: any;

    beforeEach(() => {
        originalEnv = { ...process.env };
        process.env.JWT_SECRET = 'test-secret';
        
        mockReq = {
            headers: {}
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        mockNext = vi.fn();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('generateToken / getSecret', () => {
        it('should throw error when neither JWT_SECRET nor NEXTAUTH_SECRET is configured', () => {
            delete process.env.JWT_SECRET;
            delete process.env.NEXTAUTH_SECRET;

            expect(() => generateToken({ id: '1', email: 'test@test.com' })).toThrow(
                'JWT_SECRET or NEXTAUTH_SECRET not configured'
            );
        });

        it('should use NEXTAUTH_SECRET if JWT_SECRET is not configured', () => {
            delete process.env.JWT_SECRET;
            process.env.NEXTAUTH_SECRET = 'nextauth-secret';

            const token = generateToken({ id: '1', email: 'test@test.com' });
            expect(token).toBeDefined();

            const decoded = jwt.verify(token, 'nextauth-secret');
            expect(decoded).toMatchObject({ id: '1', email: 'test@test.com' });
        });

        it('should generate token using JWT_SECRET', () => {
            const token = generateToken({ id: '1', email: 'test@test.com', rol: 'ADMIN' });
            expect(token).toBeDefined();

            const decoded = jwt.verify(token, 'test-secret');
            expect(decoded).toMatchObject({ id: '1', email: 'test@test.com', rol: 'ADMIN' });
        });
    });

    describe('authMiddleware', () => {
        it('should return 401 if authorization header is missing', () => {
            authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No se proporcionó token de autenticación' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if authorization header does not start with Bearer', () => {
            mockReq.headers!.authorization = 'Basic abc';
            
            authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No se proporcionó token de autenticación' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid or expired', () => {
            mockReq.headers!.authorization = 'Bearer invalid-token-data';

            authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Token inválido o expirado' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next and populate req.user if token is valid', () => {
            const token = generateToken({ id: 'user-1', email: 'user@test.com', rol: 'USER' });
            mockReq.headers!.authorization = `Bearer ${token}`;

            authMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockReq.user).toBeDefined();
            expect(mockReq.user?.id).toBe('user-1');
            expect(mockReq.user?.email).toBe('user@test.com');
            expect(mockReq.user?.rol).toBe('USER');
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('roleGuard', () => {
        it('should return 401 if req.user is missing', () => {
            const guard = roleGuard(['ADMIN']);
            guard(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Usuario no autenticado' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 if req.user.rol is missing', () => {
            mockReq.user = { id: '1', email: 'test@test.com' };
            const guard = roleGuard(['ADMIN']);
            
            guard(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No tienes permisos para esta acción' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 403 if req.user.rol is not allowed', () => {
            mockReq.user = { id: '1', email: 'test@test.com', rol: 'USER' };
            const guard = roleGuard(['ADMIN']);
            
            guard(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'No tienes permisos para esta acción' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should call next if req.user.rol is in allowedRoles', () => {
            mockReq.user = { id: '1', email: 'test@test.com', rol: 'ADMIN' };
            const guard = roleGuard(['ADMIN', 'SUPER_ADMIN']);
            
            guard(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });
    });
});
