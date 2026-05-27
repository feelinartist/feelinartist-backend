import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock target repository
vi.mock('../../infrastructure/repositories/prisma-config-sistema-repository', () => {
    return {
        PrismaConfigSistemaRepository: class MockPrismaConfigSistemaRepository {
            obtenerTodas = (...args: any[]) => (globalThis as any).mockObtenerTodas(...args);
            obtenerPorClave = (...args: any[]) => (globalThis as any).mockObtenerPorClave(...args);
            crear = (...args: any[]) => (globalThis as any).mockCrear(...args);
            actualizar = (...args: any[]) => (globalThis as any).mockActualizarConfigSistema(...args);
            eliminar = (...args: any[]) => (globalThis as any).mockEliminarConfigSistema(...args);
        }
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockObtenerTodas = vi.fn();
(globalThis as any).mockObtenerPorClave = vi.fn();
(globalThis as any).mockCrear = vi.fn();
(globalThis as any).mockActualizarConfigSistema = vi.fn();
(globalThis as any).mockEliminarConfigSistema = vi.fn();

import { ControladorConfigSistema } from './controlador-config-sistema';

describe('ControladorConfigSistema', () => {
    let controller: ControladorConfigSistema;
    let req: Partial<Request> & { user?: { id: string; rol: string } };
    let res: Partial<Response>;
    let next: NextFunction;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorConfigSistema();

        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        next = vi.fn();
        req = {
            body: {},
            params: {},
            query: {},
            user: { id: 'admin-user-1', rol: 'ADMIN' }
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('verificarAcceso', () => {
        it('should call next if user is ADMIN', () => {
            req.user = { id: 'user-1', rol: 'ADMIN' };
            controller.verificarAcceso(req as any, res as Response, next);
            expect(next).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should call next if user is SUPERADMIN', () => {
            req.user = { id: 'user-1', rol: 'SUPERADMIN' };
            controller.verificarAcceso(req as any, res as Response, next);
            expect(next).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return 403 if user role is not ADMIN or SUPERADMIN', () => {
            req.user = { id: 'user-1', rol: 'USER' };
            controller.verificarAcceso(req as any, res as Response, next);
            expect(next).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Acceso denegado. Solo SUPERADMIN y ADMIN pueden acceder.' });
        });

        it('should return 403 if user is not attached to request', () => {
            delete req.user;
            controller.verificarAcceso(req as any, res as Response, next);
            expect(next).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });

    describe('listarTodas', () => {
        it('should list all configurations and return status 200', async () => {
            const mockConfigs = [{ id: '1', clave: 'TEST', valor: 'VALUE' }];
            (globalThis as any).mockObtenerTodas.mockResolvedValue(mockConfigs);

            await controller.listarTodas(req as any, res as Response);

            expect((globalThis as any).mockObtenerTodas).toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledWith(mockConfigs);
        });

        it('should return 500 status on service error', async () => {
            (globalThis as any).mockObtenerTodas.mockRejectedValue(new Error('DB error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.listarTodas(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });

    describe('obtenerPorClave', () => {
        it('should return configuration by key', async () => {
            req.params = { clave: 'MY_KEY' };
            const mockConfig = { id: '1', clave: 'MY_KEY', valor: 'VALUE' };
            (globalThis as any).mockObtenerPorClave.mockResolvedValue(mockConfig);

            await controller.obtenerPorClave(req as any, res as Response);

            expect((globalThis as any).mockObtenerPorClave).toHaveBeenCalledWith('MY_KEY');
            expect(jsonMock).toHaveBeenCalledWith(mockConfig);
        });

        it('should return 404 if configuration not found', async () => {
            req.params = { clave: 'MY_KEY' };
            (globalThis as any).mockObtenerPorClave.mockResolvedValue(null);

            await controller.obtenerPorClave(req as any, res as Response);

            expect((globalThis as any).mockObtenerPorClave).toHaveBeenCalledWith('MY_KEY');
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Configuración no encontrada' });
        });

        it('should return 500 status on repository error', async () => {
            req.params = { clave: 'MY_KEY' };
            (globalThis as any).mockObtenerPorClave.mockRejectedValue(new Error('DB error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.obtenerPorClave(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });

    describe('crear', () => {
        it('should return 400 if clave is missing', async () => {
            req.body = { valor: 'VALUE' };

            await controller.crear(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Clave y valor son requeridos' });
        });

        it('should return 400 if valor is missing', async () => {
            req.body = { clave: 'KEY' };

            await controller.crear(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Clave y valor son requeridos' });
        });

        it('should create configuration with creator user ID and return status 201', async () => {
            req.body = { clave: 'KEY', valor: 'VALUE', descripcion: 'DESC' };
            const mockCreated = { id: '1', clave: 'KEY', valor: 'VALUE', descripcion: 'DESC', creadoPor: 'admin-user-1' };
            (globalThis as any).mockCrear.mockResolvedValue(mockCreated);

            await controller.crear(req as any, res as Response);

            expect((globalThis as any).mockCrear).toHaveBeenCalledWith({
                clave: 'KEY',
                valor: 'VALUE',
                descripcion: 'DESC',
                creadoPor: 'admin-user-1'
            });
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreated);
        });

        it('should handle undefined user gracefully', async () => {
            delete req.user;
            req.body = { clave: 'KEY', valor: 'VALUE' };
            const mockCreated = { id: '1', clave: 'KEY', valor: 'VALUE', creadoPor: undefined };
            (globalThis as any).mockCrear.mockResolvedValue(mockCreated);

            await controller.crear(req as any, res as Response);

            expect((globalThis as any).mockCrear).toHaveBeenCalledWith({
                clave: 'KEY',
                valor: 'VALUE',
                descripcion: undefined,
                creadoPor: undefined
            });
            expect(statusMock).toHaveBeenCalledWith(201);
        });

        it('should return 400 with message if Prisma code is P2002 (duplicate key)', async () => {
            req.body = { clave: 'KEY', valor: 'VALUE' };
            const prismaError = new Error('Prisma error');
            (prismaError as any).code = 'P2002';
            (globalThis as any).mockCrear.mockRejectedValue(prismaError);
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crear(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Ya existe una configuración con esa clave' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });

        it('should return 500 status on other errors', async () => {
            req.body = { clave: 'KEY', valor: 'VALUE' };
            (globalThis as any).mockCrear.mockRejectedValue(new Error('Other error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crear(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });

    describe('actualizar', () => {
        it('should return 400 if valor is missing', async () => {
            req.params = { id: 'config-1' };
            req.body = {};

            await controller.actualizar(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Valor es requerido' });
        });

        it('should update configuration and return 200 status', async () => {
            req.params = { id: 'config-1' };
            req.body = { valor: 'NEW_VALUE' };
            const mockUpdated = { id: 'config-1', valor: 'NEW_VALUE', actualizadoPor: 'admin-user-1' };
            (globalThis as any).mockActualizarConfigSistema.mockResolvedValue(mockUpdated);

            await controller.actualizar(req as any, res as Response);

            expect((globalThis as any).mockActualizarConfigSistema).toHaveBeenCalledWith('config-1', 'NEW_VALUE', 'admin-user-1');
            expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
        });

        it('should handle undefined user gracefully on update', async () => {
            delete req.user;
            req.params = { id: 'config-1' };
            req.body = { valor: 'NEW_VALUE' };
            (globalThis as any).mockActualizarConfigSistema.mockResolvedValue({ id: 'config-1' });

            await controller.actualizar(req as any, res as Response);

            expect((globalThis as any).mockActualizarConfigSistema).toHaveBeenCalledWith('config-1', 'NEW_VALUE', undefined);
        });

        it('should return 500 status on update repository error', async () => {
            req.params = { id: 'config-1' };
            req.body = { valor: 'NEW_VALUE' };
            (globalThis as any).mockActualizarConfigSistema.mockRejectedValue(new Error('DB error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.actualizar(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });

    describe('eliminar', () => {
        it('should delete configuration and return 200 status', async () => {
            req.params = { id: 'config-1' };
            (globalThis as any).mockEliminarConfigSistema.mockResolvedValue(undefined);

            await controller.eliminar(req as any, res as Response);

            expect((globalThis as any).mockEliminarConfigSistema).toHaveBeenCalledWith('config-1');
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Configuración eliminada correctamente' });
        });

        it('should return 500 status on delete error', async () => {
            req.params = { id: 'config-1' };
            (globalThis as any).mockEliminarConfigSistema.mockRejectedValue(new Error('DB error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminar(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
});
