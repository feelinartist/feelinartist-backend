import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(request: any): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: vi.fn(),
            getNext: vi.fn(),
        }),
        getClass: vi.fn(),
        getHandler: vi.fn(),
        getType: vi.fn(),
    } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let guard: JwtAuthGuard;

    beforeEach(() => {
        originalEnv = { ...process.env };
        process.env.JWT_SECRET = 'guard-secret';
        guard = new JwtAuthGuard();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should throw an error if configuration is missing', () => {
        delete process.env.JWT_SECRET;
        delete process.env.NEXTAUTH_SECRET;

        const request = { headers: { authorization: 'Bearer token' } };
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('Token invÃ¡lido o expirado');
    });

    it('should work with NEXTAUTH_SECRET if JWT_SECRET is not configured', () => {
        delete process.env.JWT_SECRET;
        process.env.NEXTAUTH_SECRET = 'nextauth-guard-secret';

        const token = jwt.sign({ id: 'u1', email: 'user@test.com' }, 'nextauth-guard-secret');
        const request = { headers: { authorization: `Bearer ${token}` } };
        const context = createContext(request);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(request).toMatchObject({
            user: { id: 'u1', email: 'user@test.com' }
        });
    });

    it('should throw CompatibleUnauthorizedException if authorization header is missing', () => {
        const request = { headers: {} };
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('No se proporcionÃ³ token de autenticaciÃ³n');
    });

    it('should throw CompatibleUnauthorizedException if authorization header does not start with Bearer', () => {
        const request = { headers: { authorization: 'Basic abc' } };
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('No se proporcionÃ³ token de autenticaciÃ³n');
    });

    it('should throw CompatibleUnauthorizedException if token is invalid or expired', () => {
        const request = { headers: { authorization: 'Bearer invalid-token' } };
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('Token invÃ¡lido o expirado');
    });

    it('should attach user to request and return true on valid token', () => {
        const token = jwt.sign({ id: 'u1', email: 'user@test.com', rol: 'USER' }, 'guard-secret');
        const request = { headers: { authorization: `Bearer ${token}` } };
        const context = createContext(request);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
        expect(request).toMatchObject({
            user: { id: 'u1', email: 'user@test.com', rol: 'USER' }
        });
    });
});
