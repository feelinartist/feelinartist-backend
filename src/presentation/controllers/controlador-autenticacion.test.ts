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
        RepositorioUsuarioPrisma: class MockRepositorioUsuarioPrisma {}
    };
});

vi.mock('../../middleware/auth', () => {
    return {
        generateToken: (...args: any[]) => (globalThis as any).mockGenerateToken(...args)
    };
});

// Assign actual spy functions to globalThis
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

        it('should login, generate token and return user details with status 200', async () => {
            req.body = { correo: 'test@example.com', nombre: 'Test User', imagen: 'avatar.png' };
            const mockUser = {
                id: 'user-1',
                correo: 'test@example.com',
                nombre: 'Test User',
                rol: { nombre: 'PUBLICO' }
            };
            (globalThis as any).mockCrearUsuarioEjecutar.mockResolvedValue(mockUser);
            (globalThis as any).mockGenerateToken.mockReturnValue('jwt-token-123');

            await controller.iniciarSesion(req as Request, res as Response);

            expect((globalThis as any).mockCrearUsuarioEjecutar).toHaveBeenCalledWith({
                correo: 'test@example.com',
                nombre: 'Test User',
                imagen: 'avatar.png'
            });
            expect((globalThis as any).mockGenerateToken).toHaveBeenCalledWith({
                id: 'user-1',
                email: 'test@example.com',
                rol: 'PUBLICO'
            });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ ...mockUser, token: 'jwt-token-123' });
        });

        it('should return 500 status on service error', async () => {
            req.body = { correo: 'test@example.com' };
            (globalThis as any).mockCrearUsuarioEjecutar.mockRejectedValue(new Error('Auth error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.iniciarSesion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error interno del servidor' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
