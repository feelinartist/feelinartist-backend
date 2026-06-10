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
        it('should return 400 if idToken is missing', async () => {
            req.body = { zonaHoraria: 'Test User' };

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El idToken es requerido' });
        });

        it('should return 400 if idToken is empty string', async () => {
            req.body = { idToken: '' };

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El idToken es requerido' });
        });

        it('should return 404 if user does not exist', async () => {
            req.body = { idToken: 'valid-token' };
            (globalThis as any).mockAuthServiceIniciarSesion.mockResolvedValue(null);

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario no registrado' });
        });

        it('should login, generate token and return user details with status 200', async () => {
            req.body = { idToken: 'valid-token' };
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
                'valid-token'
            );
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                ...mockUser,
                token: 'jwt-token-123',
                refreshToken: 'mock-refresh-token-123'
            });
        });

        it('should login an existing user with only idToken provided', async () => {
            req.body = { idToken: 'valid-token' };
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
            req.body = { idToken: 'valid-token' };
            (globalThis as any).mockAuthServiceIniciarSesion.mockRejectedValue(new Error('Auth error'));

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(loggerSpy).toHaveBeenCalled();
        });

        it('should return 500 status and handle errors without message property', async () => {
            req.body = { idToken: 'valid-token' };
            (globalThis as any).mockAuthServiceIniciarSesion.mockRejectedValue('Error de red sin objeto Error');

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(loggerSpy).toHaveBeenCalled();
        });

        it('should return 401 status on invalid Google token error', async () => {
            req.body = { idToken: 'invalid-token' };
            (globalThis as any).mockAuthServiceIniciarSesion.mockRejectedValue(new Error('Token de Google inválido o expirado: token signature is invalid'));

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token de Google inválido o expirado: token signature is invalid' });
        });
    });

    describe('registrar', () => {
        it('should return 400 if idToken is missing', async () => {
            req.body = { zonaHoraria: 'America/Lima' };

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El idToken es requerido' });
        });

        it('should return 400 if zonaHoraria is missing', async () => {
            req.body = { idToken: 'valid-token' };

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'La zona horaria es requerida' });
        });

        it('should return 400 if user is already registered', async () => {
            req.body = { idToken: 'valid-token', zonaHoraria: 'America/Lima' };
            (globalThis as any).mockAuthServiceRegistrar.mockRejectedValue(new Error('El usuario ya está registrado'));

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El usuario ya está registrado' });
        });

        it('should register successfully and return 201 with token', async () => {
            req.body = { idToken: 'valid-token', zonaHoraria: 'America/Lima' };
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
                'valid-token',
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
            req.body = { idToken: 'valid-token', zonaHoraria: 'America/Lima' };
            (globalThis as any).mockAuthServiceRegistrar.mockRejectedValue(new Error('Db error'));

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(loggerSpy).toHaveBeenCalled();
        });

        it('should return 401 status on invalid Google token error during register', async () => {
            req.body = { idToken: 'invalid-token', zonaHoraria: 'America/Lima' };
            (globalThis as any).mockAuthServiceRegistrar.mockRejectedValue(new Error('Token de Google inválido o sin correo'));

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Token de Google inválido o sin correo' });
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
