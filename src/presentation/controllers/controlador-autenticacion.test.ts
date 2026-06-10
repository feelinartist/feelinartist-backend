import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock target modules
vi.mock('../../application/use-cases/crear-usuario', () => {
    return {
        CrearUsuarioCasoUso: class MockCrearUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockCrearUsuarioEjecutar(...args);
        }
    };
});

vi.mock('../../infrastructure/repositories/prisma-user-repository', () => {
    return {
        RepositorioUsuarioPrisma: class MockRepositorioUsuarioPrisma {
            buscarPorCorreo = (...args: any[]) => (globalThis as any).mockBuscarPorCorreo(...args);
        }
    };
});

vi.mock('../../middleware/auth', () => {
    return {
        generateToken: (...args: any[]) => (globalThis as any).mockGenerateToken(...args)
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockBuscarPorCorreo = vi.fn().mockResolvedValue(null);
(globalThis as any).mockCrearUsuarioEjecutar = vi.fn();
(globalThis as any).mockGenerateToken = vi.fn();

import { ControladorAutenticacion } from './controlador-autenticacion';

describe('ControladorAutenticacion', () => {
    let controller: ControladorAutenticacion;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorAutenticacion();

        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('iniciarSesion', () => {
        it('should return 400 if correo is missing', async () => {
            req.body = { nombre: 'Test User' };

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'El correo es requerido' });
        });

        it('should return 404 if user does not exist', async () => {
            req.body = { correo: 'nuevo@example.com' };
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue(null);

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
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue(mockUser);
            (globalThis as any).mockCrearUsuarioEjecutar.mockResolvedValue(mockUser);
            (globalThis as any).mockGenerateToken.mockReturnValue('jwt-token-123');

            await controller.iniciarSesion(req as Request, res as Response);

            expect((globalThis as any).mockCrearUsuarioEjecutar).toHaveBeenCalledWith({
                correo: 'test@example.com',
                nombre: 'Test User',
                imagen: 'avatar.png',
                zonaHoraria: 'America/Lima'
            });
            expect((globalThis as any).mockGenerateToken).toHaveBeenCalledWith({
                id: 'user-1',
                email: 'test@example.com',
                rol: 'PUBLICO'
            });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ ...mockUser, token: 'jwt-token-123' });
        });

        it('should login an existing user with only email provided', async () => {
            req.body = { correo: 'existente@example.com' };
            const mockUser = {
                id: 'user-2',
                correo: 'existente@example.com',
                rol: { nombre: 'ARTISTA' }
            };
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue(mockUser);
            (globalThis as any).mockCrearUsuarioEjecutar.mockResolvedValue(mockUser);
            (globalThis as any).mockGenerateToken.mockReturnValue('jwt-token-456');

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ ...mockUser, token: 'jwt-token-456' });
        });

        it('should return 500 status on service error', async () => {
            req.body = { correo: 'test@example.com' };
            const mockUser = { id: 'user-3', correo: 'test@example.com' };
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue(mockUser);
            (globalThis as any).mockCrearUsuarioEjecutar.mockRejectedValue(new Error('Auth error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
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
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue({ id: 'existing-id' });

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
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue(null);
            (globalThis as any).mockCrearUsuarioEjecutar.mockResolvedValue(mockUser);
            (globalThis as any).mockGenerateToken.mockReturnValue('jwt-new-token');

            await controller.registrar(req as Request, res as Response);

            expect((globalThis as any).mockCrearUsuarioEjecutar).toHaveBeenCalledWith({
                correo: 'nuevo@example.com',
                nombre: 'Test',
                imagen: 'img',
                zonaHoraria: 'America/Lima'
            });
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({ ...mockUser, token: 'jwt-new-token' });
        });

        it('should return 500 status on register service error', async () => {
            req.body = { correo: 'nuevo@example.com', nombre: 'Test', imagen: 'img', zonaHoraria: 'America/Lima' };
            (globalThis as any).mockBuscarPorCorreo.mockResolvedValue(null);
            (globalThis as any).mockCrearUsuarioEjecutar.mockRejectedValue(new Error('Db error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.registrar(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
