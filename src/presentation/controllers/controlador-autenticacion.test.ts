import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { LoggerService } from '../../infrastructure/services/logger-service';

// Mock target modules
vi.mock('../../application/services/auth-service', () => {
    return {
        AuthService: class MockAuthService {
            iniciarSesion = (...args: any[]) => (globalThis as any).mockAuthServiceIniciarSesion(...args);
            registrar = (...args: any[]) => (globalThis as any).mockAuthServiceRegistrar(...args);
            refrescarToken = (...args: any[]) => (globalThis as any).mockAuthServiceRefrescarToken(...args);
            cerrarSesion = (...args: any[]) => (globalThis as any).mockAuthServiceCerrarSesion(...args);
        }
    };
});

// Setup mock spies on globalThis
(globalThis as any).mockAuthServiceIniciarSesion = vi.fn();
(globalThis as any).mockAuthServiceRegistrar = vi.fn();
(globalThis as any).mockAuthServiceRefrescarToken = vi.fn();
(globalThis as any).mockAuthServiceCerrarSesion = vi.fn();

import { ControladorAutenticacion } from './controlador-autenticacion';

describe('ControladorAutenticacion', () => {
    let controller: ControladorAutenticacion;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;
    let loggerSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorAutenticacion();

        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            body: {},
            params: {},
            query: {},
            headers: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };

        // Spy on LoggerService error method to suppress output and check calls
        loggerSpy = vi.spyOn(LoggerService.prototype, 'error').mockImplementation(() => {});
    });

    describe('iniciarSesion', () => {
        it('should return 400 if correo is missing', async () => {
            req.body = { nombre: 'Test User' };

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El correo es requerido' });
        });

        it('should return 400 if correo is invalid', async () => {
            req.body = { correo: 'invalido' };

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El correo debe ser un correo válido' });
        });

        it('should return 404 if user does not exist', async () => {
            req.body = { correo: 'nuevo@example.com' };
            (globalThis as any).mockAuthServiceIniciarSesion.mockResolvedValue(null);

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no registrado' });
        });

        it('should login, generate token and return user details with status 200', async () => {
            req.body = { correo: 'test@example.com', nombre: 'Test User', imagen: 'avatar.png', zonaHoraria: 'America/Lima' };
            const mockUser = {
                id: 'user-1',
                correo: 'test@example.com',
                nombre: 'Test User',
                rol: { nombre: 'PUBLICO' }
            };
            (globalThis as any).mockAuthServiceIniciarSesion.mockResolvedValue({
                usuario: mockUser,
                token: 'jwt-token-123',
                refreshToken: 'mock-refresh-token-123'
            });

            await controller.iniciarSesion(req as Request, res as Response);

            expect((globalThis as any).mockAuthServiceIniciarSesion).toHaveBeenCalledWith(
                'test@example.com',
                'Test User',
                'avatar.png',
                'America/Lima'
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                ...mockUser,
                token: 'jwt-token-123',
                refreshToken: 'mock-refresh-token-123'
            });
        });

        it('should login an existing user with only email provided', async () => {
            req.body = { correo: 'existente@example.com' };
            const mockUser = {
                id: 'user-2',
                correo: 'existente@example.com',
                rol: { nombre: 'ARTISTA' }
            };
            (globalThis as any).mockAuthServiceIniciarSesion.mockResolvedValue({
                usuario: mockUser,
                token: 'jwt-token-456',
                refreshToken: 'mock-refresh-token-123'
            });

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                ...mockUser,
                token: 'jwt-token-456',
                refreshToken: 'mock-refresh-token-123'
            });
        });

        it('should return 500 status on service error', async () => {
            req.body = { correo: 'test@example.com' };
            (globalThis as any).mockAuthServiceIniciarSesion.mockRejectedValue(new Error('Auth error'));

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(loggerSpy).toHaveBeenCalled();
        });
    });

    describe('registrar', () => {
        it('should return 400 if correo is missing', async () => {
            req.body = { nombre: 'Test', imagen: 'img', zonaHoraria: 'America/Lima' };

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El correo es requerido' });
        });

        it('should return 400 if nombre is missing', async () => {
            req.body = { correo: 'test@example.com', imagen: 'img', zonaHoraria: 'America/Lima' };

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El nombre es requerido' });
        });

        it('should return 400 if imagen is missing', async () => {
            req.body = { correo: 'test@example.com', nombre: 'Test', zonaHoraria: 'America/Lima' };

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'La imagen es requerida' });
        });

        it('should return 400 if zonaHoraria is missing', async () => {
            req.body = { correo: 'test@example.com', nombre: 'Test', imagen: 'img' };

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'La zona horaria es requerida' });
        });

        it('should return 400 if user is already registered', async () => {
            req.body = { correo: 'existente@example.com', nombre: 'Test', imagen: 'img', zonaHoraria: 'America/Lima' };
            (globalThis as any).mockAuthServiceRegistrar.mockRejectedValue(new Error('El usuario ya está registrado'));

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El usuario ya está registrado' });
        });

        it('should register successfully and return 201 with token', async () => {
            req.body = { correo: 'nuevo@example.com', nombre: 'Test', imagen: 'img', zonaHoraria: 'America/Lima' };
            const mockUser = {
                id: 'new-user-id',
                correo: 'nuevo@example.com',
                nombre: 'Test',
                imagen: 'img',
                zonaHoraria: 'America/Lima',
                rol: null
            };
            (globalThis as any).mockAuthServiceRegistrar.mockResolvedValue({
                usuario: mockUser,
                token: 'jwt-new-token',
                refreshToken: 'mock-refresh-token-123'
            });

            await controller.registrar(req as Request, res as Response);

            expect((globalThis as any).mockAuthServiceRegistrar).toHaveBeenCalledWith(
                'nuevo@example.com',
                'Test',
                'img',
                'America/Lima'
            );
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                ...mockUser,
                token: 'jwt-new-token',
                refreshToken: 'mock-refresh-token-123'
            });
        });

        it('should return 500 status on register service error', async () => {
            req.body = { correo: 'nuevo@example.com', nombre: 'Test', imagen: 'img', zonaHoraria: 'America/Lima' };
            (globalThis as any).mockAuthServiceRegistrar.mockRejectedValue(new Error('Db error'));

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(loggerSpy).toHaveBeenCalled();
        });
    });

    describe('refrescarToken', () => {
        it('should return 400 if refreshToken is missing', async () => {
            req.body = {};

            await controller.refrescarToken(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token de refresco requerido' });
        });

        it('should return 401 if refreshToken is invalid or expired', async () => {
            req.body = { refreshToken: 'invalid-token' };
            (globalThis as any).mockAuthServiceRefrescarToken.mockResolvedValue(null);

            await controller.refrescarToken(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token de refresco inválido o expirado' });
        });

        it('should rotate token and return new access and refresh tokens', async () => {
            req.body = { refreshToken: 'old-token' };
            (globalThis as any).mockAuthServiceRefrescarToken.mockResolvedValue({
                token: 'new-access-token',
                refreshToken: 'new-refresh-token'
            });

            await controller.refrescarToken(req as Request, res as Response);

            expect((globalThis as any).mockAuthServiceRefrescarToken).toHaveBeenCalledWith('old-token');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                token: 'new-access-token',
                refreshToken: 'new-refresh-token'
            });
        });

        it('should return 500 status on internal error', async () => {
            req.body = { refreshToken: 'token' };
            (globalThis as any).mockAuthServiceRefrescarToken.mockRejectedValue(new Error('DB error'));

            await controller.refrescarToken(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(loggerSpy).toHaveBeenCalled();
        });
    });

    describe('cerrarSesion', () => {
        it('should return 400 if authorization header is missing or invalid', async () => {
            req.headers = {};

            await controller.cerrarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'No se proporcionó token de autenticación' });
        });

        it('should call authService.cerrarSesion and return 200', async () => {
            req.headers = { authorization: 'Bearer token-123' };
            req.body = { refreshToken: 'refresh-token-123' };
            (globalThis as any).mockAuthServiceCerrarSesion.mockResolvedValue(undefined);

            await controller.cerrarSesion(req as Request, res as Response);

            expect((globalThis as any).mockAuthServiceCerrarSesion).toHaveBeenCalledWith(
                'token-123',
                'refresh-token-123'
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Sesión cerrada exitosamente' });
        });

        it('should return 500 status on internal error', async () => {
            req.headers = { authorization: 'Bearer token-123' };
            (globalThis as any).mockAuthServiceCerrarSesion.mockRejectedValue(new Error('Internal error'));

            await controller.cerrarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(loggerSpy).toHaveBeenCalled();
        });
    });
});
