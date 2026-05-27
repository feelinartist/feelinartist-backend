import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock target modules
vi.mock('../../application/use-cases/seguir-usuario', () => {
    return {
        SeguirUsuarioCasoUso: class MockSeguirUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockSeguirUsuario(...args);
        }
    };
});

vi.mock('../../application/use-cases/dejar-de-seguir-usuario', () => {
    return {
        DejarDeSeguirUsuarioCasoUso: class MockDejarDeSeguirUsuarioCasoUso {
            ejecutar = (...args: any[]) => (globalThis as any).mockDejarDeSeguirUsuario(...args);
        }
    };
});

vi.mock('../../infrastructure/repositories/prisma-seguidor-repository', () => {
    return {
        RepositorioSeguidorPrisma: class MockRepositorioSeguidorPrisma {}
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockSeguirUsuario = vi.fn();
(globalThis as any).mockDejarDeSeguirUsuario = vi.fn();

import { ControladorSeguidor } from './controlador-seguidor';

describe('ControladorSeguidor', () => {
    let controller: ControladorSeguidor;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorSeguidor();

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

    describe('seguir', () => {
        it('should return 400 if seguidorId is missing', async () => {
            req.body = { seguidoId: 'user-2', tipo: 'ARTISTA' };

            await controller.seguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Faltan datos requeridos' });
        });

        it('should return 400 if seguidoId is missing', async () => {
            req.body = { seguidorId: 'user-1', tipo: 'ARTISTA' };

            await controller.seguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Faltan datos requeridos' });
        });

        it('should return 400 if tipo is missing', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2' };

            await controller.seguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Faltan datos requeridos' });
        });

        it('should follow user successfully and return status 200', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2', tipo: 'ARTISTA' };
            (globalThis as any).mockSeguirUsuario.mockResolvedValue(undefined);

            await controller.seguir(req as Request, res as Response);

            expect((globalThis as any).mockSeguirUsuario).toHaveBeenCalledWith('user-1', 'user-2', 'ARTISTA');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario seguido exitosamente' });
        });

        it('should return 400 status with specific error message on failure', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2', tipo: 'ARTISTA' };
            (globalThis as any).mockSeguirUsuario.mockRejectedValue(new Error('Already following'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.seguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Already following' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 400 status with fallback message when error message is empty', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2', tipo: 'ARTISTA' };
            (globalThis as any).mockSeguirUsuario.mockRejectedValue(new Error(''));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.seguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al seguir usuario' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('dejarDeSeguir', () => {
        it('should return 400 if seguidorId is missing', async () => {
            req.body = { seguidoId: 'user-2', tipo: 'ARTISTA' };

            await controller.dejarDeSeguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Faltan datos requeridos' });
        });

        it('should return 400 if seguidoId is missing', async () => {
            req.body = { seguidorId: 'user-1', tipo: 'ARTISTA' };

            await controller.dejarDeSeguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Faltan datos requeridos' });
        });

        it('should return 400 if tipo is missing', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2' };

            await controller.dejarDeSeguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Faltan datos requeridos' });
        });

        it('should unfollow user successfully and return status 200', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2', tipo: 'ARTISTA' };
            (globalThis as any).mockDejarDeSeguirUsuario.mockResolvedValue(undefined);

            await controller.dejarDeSeguir(req as Request, res as Response);

            expect((globalThis as any).mockDejarDeSeguirUsuario).toHaveBeenCalledWith('user-1', 'user-2', 'ARTISTA');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Dejado de seguir exitosamente' });
        });

        it('should return 400 status with specific error message on failure', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2', tipo: 'ARTISTA' };
            (globalThis as any).mockDejarDeSeguirUsuario.mockRejectedValue(new Error('Not following'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.dejarDeSeguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Not following' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 400 status with fallback message when error message is empty', async () => {
            req.body = { seguidorId: 'user-1', seguidoId: 'user-2', tipo: 'ARTISTA' };
            (globalThis as any).mockDejarDeSeguirUsuario.mockRejectedValue(new Error(''));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.dejarDeSeguir(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al dejar de seguir usuario' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
