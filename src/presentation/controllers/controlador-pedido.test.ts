import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock @prisma/client to include the runtime EstadoPedidoCancion enum and the PrismaClient mock
vi.mock('@prisma/client', () => {
    class MockPrismaClient {
        $connect = vi.fn().mockResolvedValue(undefined);
        $disconnect = vi.fn().mockResolvedValue(undefined);
        $transaction = vi.fn().mockImplementation((cb) => cb(this));
        
        usuario = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        };
        
        evento = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        };
        
        pedidoCancion = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
        };

        estadisticasCancion = {
            create: vi.fn(),
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
            upsert: vi.fn(),
        };

        configuracionSistema = {
            findUnique: vi.fn(),
            findMany: vi.fn(),
        };

        bloqueo = {
            create: vi.fn(),
            deleteMany: vi.fn(),
            findMany: vi.fn(),
        };

        perfilArtista = {
            findUnique: vi.fn(),
            upsert: vi.fn(),
            delete: vi.fn(),
        };

        galeriaArtista = {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
        };

        perfilPublico = {
            findUnique: vi.fn(),
            deleteMany: vi.fn(),
        };

        perfilDiscoteca = {
            findUnique: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
        };

        artistaRedSocial = {
            deleteMany: vi.fn(),
        };

        artistaDonacion = {
            deleteMany: vi.fn(),
        };

        seguidor = {
            deleteMany: vi.fn(),
        };
    }

    return {
        PrismaClient: MockPrismaClient,
        Prisma: {
            UsuarioWhereInput: {},
            PedidoCancionWhereInput: {},
        },
        EstadoPedidoCancion: {
            PENDIENTE: 'PENDIENTE',
            ACEPTADO: 'ACEPTADO',
            RECHAZADO: 'RECHAZADO',
            CANCELADO: 'CANCELADO'
        }
    };
});

import { EstadoPedidoCancion } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma';

// Mock target repository
vi.mock('../../infrastructure/repositories/prisma-pedido-repository', () => {
    return {
        PrismaPedidoRepository: class MockPrismaPedidoRepository {
            crearPedido = (...args: any[]) => (globalThis as any).mockCrearPedido(...args);
            obtenerPedidosPorEvento = (...args: any[]) => (globalThis as any).mockObtenerPedidosPorEvento(...args);
            actualizarEstado = (...args: any[]) => (globalThis as any).mockActualizarEstadoPedido(...args);
        }
    };
});

// Mock Socket.io service
vi.mock('../../infrastructure/services/socket-service', () => {
    return {
        SocketService: {
            getInstance: () => ({
                getIO: () => (globalThis as any).mockGetIO()
            })
        }
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockCrearPedido = vi.fn();
(globalThis as any).mockObtenerPedidosPorEvento = vi.fn();
(globalThis as any).mockActualizarEstadoPedido = vi.fn();
(globalThis as any).mockGetIO = vi.fn();

import { ControladorPedido } from './controlador-pedido';

describe('ControladorPedido', () => {
    let controller: ControladorPedido;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorPedido();

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

    describe('crearPedido', () => {
        it('should return 400 if eventoId is missing', async () => {
            req.body = { titulo: 'Song A' };

            await controller.crearPedido(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'EventoId y Título son requeridos' });
        });

        it('should return 400 if titulo is missing', async () => {
            req.body = { eventoId: 'evento-1' };

            await controller.crearPedido(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'EventoId y Título son requeridos' });
        });

        it('should return 404 if event does not exist', async () => {
            req.body = { eventoId: 'evento-1', titulo: 'Song A' };
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(null);

            await controller.crearPedido(req as Request, res as Response);

            expect(prisma.evento.findUnique).toHaveBeenCalledWith({
                where: { id: 'evento-1' },
                include: { perfilArtista: true }
            });
            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Evento no encontrado' });
        });

        it('should return 403 if artist is not accepting orders', async () => {
            req.body = { eventoId: 'evento-1', titulo: 'Song A' };
            const mockEvento = {
                id: 'evento-1',
                perfilArtista: {
                    pedidosActivos: false
                }
            };
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(mockEvento as any);

            await controller.crearPedido(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'El artista no está recibiendo pedidos en este momento' });
        });

        it('should create order, emit socket event, and return status 201', async () => {
            const body = {
                eventoId: 'evento-1',
                titulo: 'Song A',
                artista: 'Artist A',
                usuarioId: 'user-1',
                itunesId: 'itunes-1',
                nombreSolicitante: 'John',
                genero: 'Pop',
                imagenUrl: 'img.png',
                previewUrl: 'prev.mp3'
            };
            req.body = body;

            const mockEvento = {
                id: 'evento-1',
                perfilArtista: {
                    pedidosActivos: true
                }
            };
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(mockEvento as any);

            const mockCreated = { id: 'pedido-1', ...body };
            (globalThis as any).mockCrearPedido.mockResolvedValue(mockCreated);

            const mockEmit = vi.fn();
            const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
            (globalThis as any).mockGetIO.mockReturnValue({ to: mockTo });

            await controller.crearPedido(req as Request, res as Response);

            expect((globalThis as any).mockCrearPedido).toHaveBeenCalledWith(body);
            expect((globalThis as any).mockGetIO).toHaveBeenCalled();
            expect(mockTo).toHaveBeenCalledWith('event:evento-1');
            expect(mockEmit).toHaveBeenCalledWith('nuevo_pedido', mockCreated);
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreated);
        });

        it('should create order successfully and handle socket errors without failing', async () => {
            const body = { eventoId: 'evento-1', titulo: 'Song A' };
            req.body = body;

            const mockEvento = { id: 'evento-1', perfilArtista: { pedidosActivos: true } };
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(mockEvento as any);

            const mockCreated = { id: 'pedido-1', ...body };
            (globalThis as any).mockCrearPedido.mockResolvedValue(mockCreated);
            (globalThis as any).mockGetIO.mockImplementation(() => {
                throw new Error('Socket server down');
            });
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearPedido(req as Request, res as Response);

            expect((globalThis as any).mockCrearPedido).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(mockCreated);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 status with specific error message on failure', async () => {
            req.body = { eventoId: 'evento-1', titulo: 'Song A' };
            vi.mocked(prisma.evento.findUnique).mockRejectedValue(new Error('DB disconnect'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearPedido(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'DB disconnect' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 status with default error message on non-Error failure', async () => {
            req.body = { eventoId: 'evento-1', titulo: 'Song A' };
            vi.mocked(prisma.evento.findUnique).mockRejectedValue('unknown-error');
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.crearPedido(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('obtenerPedidosPorEvento', () => {
        it('should return list of orders for the event', async () => {
            req.params = { eventoId: 'evento-1' };
            const mockPedidos = [{ id: '1', titulo: 'Song' }];
            (globalThis as any).mockObtenerPedidosPorEvento.mockResolvedValue(mockPedidos);

            await controller.obtenerPedidosPorEvento(req as Request, res as Response);

            expect((globalThis as any).mockObtenerPedidosPorEvento).toHaveBeenCalledWith('evento-1');
            expect(jsonMock).toHaveBeenCalledWith(mockPedidos);
        });

        it('should return 500 status on repository error', async () => {
            req.params = { eventoId: 'evento-1' };
            (globalThis as any).mockObtenerPedidosPorEvento.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.obtenerPedidosPorEvento(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('actualizarEstado', () => {
        it('should return 400 if state is invalid', async () => {
            req.params = { id: 'pedido-1' };
            req.body = { estado: 'INVALID_STATUS' };

            await controller.actualizarEstado(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Estado inválido' });
        });

        it('should update state and return updated order on valid state', async () => {
            req.params = { id: 'pedido-1' };
            req.body = { estado: 'ACEPTADO' };
            const mockUpdated = { id: 'pedido-1', estado: 'ACEPTADO' };
            (globalThis as any).mockActualizarEstadoPedido.mockResolvedValue(mockUpdated);

            await controller.actualizarEstado(req as Request, res as Response);

            expect((globalThis as any).mockActualizarEstadoPedido).toHaveBeenCalledWith('pedido-1', 'ACEPTADO');
            expect(jsonMock).toHaveBeenCalledWith(mockUpdated);
        });

        it('should return 500 status on update repository error', async () => {
            req.params = { id: 'pedido-1' };
            req.body = { estado: 'RECHAZADO' };
            (globalThis as any).mockActualizarEstadoPedido.mockRejectedValue(new Error('DB error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.actualizarEstado(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno del servidor' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
