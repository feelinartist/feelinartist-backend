import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock target repository using dynamic globalThis functions
vi.mock('../../infrastructure/repositories/prisma-config-repository', () => {
    return {
        RepositorioConfigPrisma: class MockRepositorioConfigPrisma {
            listarRedesSociales = (...args: any[]) => (globalThis as any).mockListarRedesSociales(...args);
            crearRedSocial = (...args: any[]) => (globalThis as any).mockCrearRedSocial(...args);
            actualizarRedSocial = (...args: any[]) => (globalThis as any).mockActualizarRedSocial(...args);
            eliminarRedSocial = (...args: any[]) => (globalThis as any).mockEliminarRedSocial(...args);
            listarMetodosDonacion = (...args: any[]) => (globalThis as any).mockListarMetodosDonacion(...args);
            crearMetodoDonacion = (...args: any[]) => (globalThis as any).mockCrearMetodoDonacion(...args);
            actualizarMetodoDonacion = (...args: any[]) => (globalThis as any).mockActualizarMetodoDonacion(...args);
            eliminarMetodoDonacion = (...args: any[]) => (globalThis as any).mockEliminarMetodoDonacion(...args);
            listarCategoriasArtista = (...args: any[]) => (globalThis as any).mockListarCategoriasArtista(...args);
            crearCategoriaArtista = (...args: any[]) => (globalThis as any).mockCrearCategoriaArtista(...args);
            actualizarCategoriaArtista = (...args: any[]) => (globalThis as any).mockActualizarCategoriaArtista(...args);
            eliminarCategoriaArtista = (...args: any[]) => (globalThis as any).mockEliminarCategoriaArtista(...args);
            listarRoles = (...args: any[]) => (globalThis as any).mockListarRoles(...args);
        }
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockListarRedesSociales = vi.fn();
(globalThis as any).mockCrearRedSocial = vi.fn();
(globalThis as any).mockActualizarRedSocial = vi.fn();
(globalThis as any).mockEliminarRedSocial = vi.fn();
(globalThis as any).mockListarMetodosDonacion = vi.fn();
(globalThis as any).mockCrearMetodoDonacion = vi.fn();
(globalThis as any).mockActualizarMetodoDonacion = vi.fn();
(globalThis as any).mockEliminarMetodoDonacion = vi.fn();
(globalThis as any).mockListarCategoriasArtista = vi.fn();
(globalThis as any).mockCrearCategoriaArtista = vi.fn();
(globalThis as any).mockActualizarCategoriaArtista = vi.fn();
(globalThis as any).mockEliminarCategoriaArtista = vi.fn();
(globalThis as any).mockListarRoles = vi.fn();

import { ControladorAdminConfig } from './controlador-admin-config';

describe('ControladorAdminConfig', () => {
    let controller: ControladorAdminConfig;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorAdminConfig();

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

    describe('listarRedesSociales', () => {
        it('should return redes sociales list and 200 status', async () => {
            const mockRedes = [{ id: '1', nombre: 'Facebook' }];
            (globalThis as any).mockListarRedesSociales.mockResolvedValue(mockRedes);

            await controller.listarRedesSociales(req as Request, res as Response);

            expect((globalThis as any).mockListarRedesSociales).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockRedes);
        });

        it('should return 500 status on repository error', async () => {
            (globalThis as any).mockListarRedesSociales.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.listarRedesSociales(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al listar redes sociales' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('crearRedSocial', () => {
        it('should return 400 if nombre is missing', async () => {
            req.body = { urlBase: 'https://fb.com' };

            await controller.crearRedSocial(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Nombre y URL base requeridos' });
        });

        it('should return 400 if urlBase is missing', async () => {
            req.body = { nombre: 'Facebook' };

            await controller.crearRedSocial(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Nombre y URL base requeridos' });
        });

        it('should create red social and return 201 status', async () => {
            const mockBody = { nombre: 'Facebook', urlBase: 'https://fb.com', icono: 'fb-icon' };
            const mockCreated = { id: '1', ...mockBody };
            (globalThis as any).mockCrearRedSocial.mockResolvedValue(mockCreated);
            req.body = mockBody;

            await controller.crearRedSocial(req as Request, res as Response);

            expect((globalThis as any).mockCrearRedSocial).toHaveBeenCalledWith(mockBody);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreated);
        });

        it('should return 500 status on repository error', async () => {
            req.body = { nombre: 'Facebook', urlBase: 'https://fb.com' };
            (globalThis as any).mockCrearRedSocial.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearRedSocial(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al crear red social' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('actualizarRedSocial', () => {
        it('should update red social and return 200 status', async () => {
            req.params = { id: 'red-1' };
            req.body = { nombre: 'Facebook Updated' };
            const mockUpdated = { id: 'red-1', nombre: 'Facebook Updated' };
            (globalThis as any).mockActualizarRedSocial.mockResolvedValue(mockUpdated);

            await controller.actualizarRedSocial(req as Request, res as Response);

            expect((globalThis as any).mockActualizarRedSocial).toHaveBeenCalledWith('red-1', { nombre: 'Facebook Updated' });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
        });

        it('should return 500 status on repository error', async () => {
            req.params = { id: 'red-1' };
            (globalThis as any).mockActualizarRedSocial.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.actualizarRedSocial(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al actualizar red social' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('eliminarRedSocial', () => {
        it('should delete red social and return 200 status', async () => {
            req.params = { id: 'red-1' };
            (globalThis as any).mockEliminarRedSocial.mockResolvedValue(undefined);

            await controller.eliminarRedSocial(req as Request, res as Response);

            expect((globalThis as any).mockEliminarRedSocial).toHaveBeenCalledWith('red-1');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Red social eliminada' });
        });

        it('should return 500 status on repository error', async () => {
            req.params = { id: 'red-1' };
            (globalThis as any).mockEliminarRedSocial.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminarRedSocial(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al eliminar red social' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('listarMetodosDonacion', () => {
        it('should return metodos donacion list and 200 status', async () => {
            const mockMetodos = [{ id: '1', nombre: 'Paypal' }];
            (globalThis as any).mockListarMetodosDonacion.mockResolvedValue(mockMetodos);

            await controller.listarMetodosDonacion(req as Request, res as Response);

            expect((globalThis as any).mockListarMetodosDonacion).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockMetodos);
        });

        it('should return 500 status on repository error', async () => {
            (globalThis as any).mockListarMetodosDonacion.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.listarMetodosDonacion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al listar métodos de donación' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('crearMetodoDonacion', () => {
        it('should return 400 if nombre is missing', async () => {
            req.body = { icono: 'paypal-icon' };

            await controller.crearMetodoDonacion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Nombre requerido' });
        });

        it('should create metodo donacion and return 201 status', async () => {
            const mockBody = { nombre: 'Paypal', icono: 'paypal-icon' };
            const mockCreated = { id: '1', ...mockBody };
            (globalThis as any).mockCrearMetodoDonacion.mockResolvedValue(mockCreated);
            req.body = mockBody;

            await controller.crearMetodoDonacion(req as Request, res as Response);

            expect((globalThis as any).mockCrearMetodoDonacion).toHaveBeenCalledWith(mockBody);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreated);
        });

        it('should return 500 status on repository error', async () => {
            req.body = { nombre: 'Paypal' };
            (globalThis as any).mockCrearMetodoDonacion.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearMetodoDonacion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al crear método de donación' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('actualizarMetodoDonacion', () => {
        it('should update metodo donacion and return 200 status', async () => {
            req.params = { id: 'metodo-1' };
            req.body = { nombre: 'Paypal Updated' };
            const mockUpdated = { id: 'metodo-1', nombre: 'Paypal Updated' };
            (globalThis as any).mockActualizarMetodoDonacion.mockResolvedValue(mockUpdated);

            await controller.actualizarMetodoDonacion(req as Request, res as Response);

            expect((globalThis as any).mockActualizarMetodoDonacion).toHaveBeenCalledWith('metodo-1', { nombre: 'Paypal Updated' });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
        });

        it('should return 500 status on repository error', async () => {
            req.params = { id: 'metodo-1' };
            (globalThis as any).mockActualizarMetodoDonacion.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.actualizarMetodoDonacion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al actualizar método de donación' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('eliminarMetodoDonacion', () => {
        it('should delete metodo donacion and return 200 status', async () => {
            req.params = { id: 'metodo-1' };
            (globalThis as any).mockEliminarMetodoDonacion.mockResolvedValue(undefined);

            await controller.eliminarMetodoDonacion(req as Request, res as Response);

            expect((globalThis as any).mockEliminarMetodoDonacion).toHaveBeenCalledWith('metodo-1');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Método de donación eliminado' });
        });

        it('should return 500 status on repository error', async () => {
            req.params = { id: 'metodo-1' };
            (globalThis as any).mockEliminarMetodoDonacion.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminarMetodoDonacion(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al eliminar método de donación' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('listarCategoriasArtista', () => {
        it('should return categories list and 200 status', async () => {
            const mockCats = [{ id: 'cat-1', nombre: 'DJ' }];
            (globalThis as any).mockListarCategoriasArtista.mockResolvedValue(mockCats);

            await controller.listarCategoriasArtista(req as Request, res as Response);

            expect((globalThis as any).mockListarCategoriasArtista).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockCats);
        });

        it('should return 500 status on repository error', async () => {
            (globalThis as any).mockListarCategoriasArtista.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.listarCategoriasArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al listar categorías de artista' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('crearCategoriaArtista', () => {
        it('should return 400 if nombre is missing', async () => {
            req.body = {};

            await controller.crearCategoriaArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Nombre requerido' });
        });

        it('should create category and return 201 status', async () => {
            const mockBody = { nombre: 'DJ' };
            const mockCreated = { id: 'cat-1', ...mockBody };
            (globalThis as any).mockCrearCategoriaArtista.mockResolvedValue(mockCreated);
            req.body = mockBody;

            await controller.crearCategoriaArtista(req as Request, res as Response);

            expect((globalThis as any).mockCrearCategoriaArtista).toHaveBeenCalledWith(mockBody);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreated);
        });

        it('should return 500 status on repository error', async () => {
            req.body = { nombre: 'DJ' };
            (globalThis as any).mockCrearCategoriaArtista.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearCategoriaArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al crear categoría de artista' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('actualizarCategoriaArtista', () => {
        it('should update category and return 200 status', async () => {
            req.params = { id: 'cat-1' };
            req.body = { nombre: 'Banda' };
            const mockUpdated = { id: 'cat-1', nombre: 'Banda' };
            (globalThis as any).mockActualizarCategoriaArtista.mockResolvedValue(mockUpdated);

            await controller.actualizarCategoriaArtista(req as Request, res as Response);

            expect((globalThis as any).mockActualizarCategoriaArtista).toHaveBeenCalledWith('cat-1', { nombre: 'Banda' });
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
        });

        it('should return 500 status on repository error', async () => {
            req.params = { id: 'cat-1' };
            (globalThis as any).mockActualizarCategoriaArtista.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.actualizarCategoriaArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al actualizar categoría de artista' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('eliminarCategoriaArtista', () => {
        it('should delete category and return 200 status', async () => {
            req.params = { id: 'cat-1' };
            (globalThis as any).mockEliminarCategoriaArtista.mockResolvedValue(undefined);

            await controller.eliminarCategoriaArtista(req as Request, res as Response);

            expect((globalThis as any).mockEliminarCategoriaArtista).toHaveBeenCalledWith('cat-1');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Categoría de artista eliminada' });
        });

        it('should return 500 status on repository error', async () => {
            req.params = { id: 'cat-1' };
            (globalThis as any).mockEliminarCategoriaArtista.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminarCategoriaArtista(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al eliminar categoría de artista' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('listarRoles', () => {
        it('should return roles list and 200 status', async () => {
            const mockRoles = [{ id: '1', nombre: 'Admin' }];
            (globalThis as any).mockListarRoles.mockResolvedValue(mockRoles);

            await controller.listarRoles(req as Request, res as Response);

            expect((globalThis as any).mockListarRoles).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(mockRoles);
        });

        it('should return 500 status on repository error', async () => {
            (globalThis as any).mockListarRoles.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.listarRoles(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al listar roles' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
