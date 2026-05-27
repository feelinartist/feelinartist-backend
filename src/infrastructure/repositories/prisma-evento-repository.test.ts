import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaEventoRepository } from './prisma-evento-repository';
import prisma from '../database/prisma';
import { redisService } from '../services/redis-service';

// Mock de dependencias
vi.mock('../database/prisma', () => ({
    default: {
        perfilArtista: { findFirst: vi.fn(), update: vi.fn() },
        evento: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
        pedidoCancion: { deleteMany: vi.fn(), groupBy: vi.fn() },
        $transaction: vi.fn((cb) => cb(prisma)), // Simula transacción ejecutando el callback
    },
}));

vi.mock('../services/redis-service', () => ({
    redisService: { del: vi.fn(), get: vi.fn(), set: vi.fn() },
}));

describe('PrismaEventoRepository', () => {
    let repository: PrismaEventoRepository;

    beforeEach(() => {
        repository = new PrismaEventoRepository();
        vi.resetAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('crearEvento', () => {
        it('debe crear un evento exitosamente', async () => {
            const perfil = { id: 'a1', usuarioId: 'u1', usuario: { nombreUsuario: 'test' } };
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(perfil as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.evento.create).mockResolvedValue({ id: 'e1' } as any);

            const result = await repository.crearEvento('u1', 'Titulo');
            expect(result.id).toBe('e1');
            expect(redisService.del).toHaveBeenCalledWith('artist:a1:active_event');
            expect(redisService.del).toHaveBeenCalledWith('artist:u1:active_event');
            expect(redisService.del).toHaveBeenCalledWith('user:profile:test');
        });

        it('debe crear un evento exitosamente si el usuario no tiene nombreUsuario', async () => {
            const perfil = { id: 'a1', usuarioId: 'u1', usuario: null };
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(perfil as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue(null);
            vi.mocked(prisma.evento.create).mockResolvedValue({ id: 'e1' } as any);

            const result = await repository.crearEvento('u1', 'Titulo');
            expect(result.id).toBe('e1');
            expect(redisService.del).toHaveBeenCalledTimes(2); // no user:profile del
        });

        it('debe fallar si no existe el perfil', async () => {
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(null);
            await expect(repository.crearEvento('u1', 'Titulo')).rejects.toThrow('Perfil de artista no encontrado');
        });

        it('debe fallar si ya hay un evento activo', async () => {
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue({ id: 'a1' } as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue({ id: 'e1' } as any);
            await expect(repository.crearEvento('u1', 'Titulo')).rejects.toThrow('Ya tienes un evento en curso');
        });
    });

    describe('finalizarEvento', () => {
        it('debe finalizar un evento correctamente', async () => {
            const evento = { id: 'e1', perfilArtistaId: 'a1', perfilArtista: { usuarioId: 'u1', usuario: { nombreUsuario: 'test' } } };
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(evento as any);
            vi.mocked(prisma.evento.update).mockResolvedValue(evento as any);

            const result = await repository.finalizarEvento('e1');
            expect(result.id).toBe('e1');
            expect(prisma.pedidoCancion.deleteMany).toHaveBeenCalled();
            expect(redisService.del).toHaveBeenCalledWith('artist:a1:active_event');
            expect(redisService.del).toHaveBeenCalledWith('artist:u1:active_event');
            expect(redisService.del).toHaveBeenCalledWith('user:profile:test');
        });

        it('debe finalizar un evento correctamente si el artista o usuario son null', async () => {
            const evento = { id: 'e1', perfilArtistaId: null, perfilArtista: null };
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(evento as any);
            vi.mocked(prisma.evento.update).mockResolvedValue(evento as any);

            const result = await repository.finalizarEvento('e1');
            expect(result.id).toBe('e1');
            expect(prisma.perfilArtista.update).not.toHaveBeenCalled();
            expect(redisService.del).not.toHaveBeenCalled();
        });

        it('debe fallar si el evento no existe', async () => {
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(null);
            await expect(repository.finalizarEvento('e1')).rejects.toThrow('Evento no encontrado');
        });
    });

    describe('obtenerEventoActivo', () => {
        it('debe retornar evento desde caché', async () => {
            vi.mocked(redisService.get).mockResolvedValue(JSON.stringify({ id: 'e1' }));
            const result = await repository.obtenerEventoActivo('u1');
            expect(result.id).toBe('e1');
        });

        it('debe consultar DB si no hay caché', async () => {
            vi.mocked(redisService.get).mockResolvedValue(null);
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue({ id: 'a1' } as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue({ id: 'e2' } as any);
            
            const result = await repository.obtenerEventoActivo('u1');
            expect(result.id).toBe('e2');
            expect(redisService.set).toHaveBeenCalledWith('artist:u1:active_event', expect.any(String), 300);
        });

        it('debe retornar null si no existe el perfil de artista', async () => {
            vi.mocked(redisService.get).mockResolvedValue(null);
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(null);

            const result = await repository.obtenerEventoActivo('u1');
            expect(result).toBeNull();
        });

        it('debe retornar null si el perfil existe pero no hay evento activo en DB', async () => {
            vi.mocked(redisService.get).mockResolvedValue(null);
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue({ id: 'a1' } as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue(null);

            const result = await repository.obtenerEventoActivo('u1');
            expect(result).toBeNull();
            expect(redisService.set).not.toHaveBeenCalled();
        });

        it('debe manejar errores de lectura de Redis y consultar DB', async () => {
            vi.mocked(redisService.get).mockRejectedValue(new Error('Redis get error'));
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue({ id: 'a1' } as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue({ id: 'e2' } as any);

            const result = await repository.obtenerEventoActivo('u1');
            expect(result.id).toBe('e2');
            expect(console.warn).toHaveBeenCalledWith('Redis error in obtenerEventoActivo:', expect.any(Error));
        });

        it('debe manejar errores de escritura de Redis de manera silenciosa', async () => {
            vi.mocked(redisService.get).mockResolvedValue(null);
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue({ id: 'a1' } as any);
            vi.mocked(prisma.evento.findFirst).mockResolvedValue({ id: 'e2' } as any);
            vi.mocked(redisService.set).mockRejectedValue(new Error('Redis set error'));

            const result = await repository.obtenerEventoActivo('u1');
            expect(result.id).toBe('e2');
            expect(console.warn).toHaveBeenCalledWith('Redis save error in obtenerEventoActivo:', expect.any(Error));
        });
    });

    describe('togglePedidos', () => {
        it('debe activar/desactivar pedidos del perfil de artista exitosamente', async () => {
            const perfil = { id: 'a1', usuarioId: 'u1', usuario: { nombreUsuario: 'test' } };
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(perfil as any);
            vi.mocked(prisma.perfilArtista.update).mockResolvedValue({ id: 'a1', pedidosActivos: true } as any);

            const result = await repository.togglePedidos('u1', true);

            expect(prisma.perfilArtista.update).toHaveBeenCalledWith({
                where: { id: 'a1' },
                data: { pedidosActivos: true }
            });
            expect(redisService.del).toHaveBeenCalledWith('artist:u1:active_event');
            expect(redisService.del).toHaveBeenCalledWith('artist:a1:active_event');
            expect(redisService.del).toHaveBeenCalledWith('user:profile:test');
            expect(result).toEqual({ id: 'a1', pedidosActivos: true });
        });

        it('debe lanzar error si no encuentra el perfil', async () => {
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(null);

            await expect(repository.togglePedidos('u1', true)).rejects.toThrow('Perfil de artista no encontrado');
        });

        it('debe alternar pedidos si no existe el nombreUsuario', async () => {
            const perfil = { id: 'a1', usuarioId: 'u1', usuario: null };
            vi.mocked(prisma.perfilArtista.findFirst).mockResolvedValue(perfil as any);
            vi.mocked(prisma.perfilArtista.update).mockResolvedValue({ id: 'a1', pedidosActivos: false } as any);

            const result = await repository.togglePedidos('u1', false);

            expect(redisService.del).toHaveBeenCalledTimes(2); // no user:profile del
            expect(result).toEqual({ id: 'a1', pedidosActivos: false });
        });
    });

    describe('obtenerEventosPorArtista', () => {
        it('debe retornar lista de eventos del artista', async () => {
            const mockEventos = [{ id: 'e1', titulo: 'E1', activo: true }];
            vi.mocked(prisma.evento.findMany).mockResolvedValue(mockEventos as any);

            const result = await repository.obtenerEventosPorArtista('a1');

            expect(prisma.evento.findMany).toHaveBeenCalledWith({
                where: { perfilArtistaId: 'a1' },
                select: {
                    id: true,
                    titulo: true,
                    horaInicio: true,
                    horaFin: true,
                    activo: true
                },
                orderBy: { horaInicio: 'desc' }
            });
            expect(result).toEqual(mockEventos);
        });
    });

    describe('obtenerEventosPaginados', () => {
        it('debe calcular estadísticas correctamente sin termino de busqueda', async () => {
            vi.mocked(prisma.evento.findMany).mockResolvedValue([{ id: 'e1' }] as any);
            vi.mocked(prisma.evento.count).mockResolvedValue(1);
            vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValue([
                { estado: 'ACEPTADO', _count: 8 },
                { estado: 'RECHAZADO', _count: 2 }
            ] as any);

            const result = await repository.obtenerEventosPaginados('a1');
            expect(result.eventos[0].tasaAceptacion).toBe(80);
            expect(result.total).toBe(1);
            expect(result.currentPage).toBe(1);
            expect(result.totalPages).toBe(1);
        });

        it('debe filtrar por titulo cuando se provee el parametro search', async () => {
            vi.mocked(prisma.evento.findMany).mockResolvedValue([{ id: 'e1' }] as any);
            vi.mocked(prisma.evento.count).mockResolvedValue(1);
            vi.mocked(prisma.pedidoCancion.groupBy).mockResolvedValue([] as any);

            await repository.obtenerEventosPaginados('a1', 2, 10, 'concierto');

            expect(prisma.evento.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    perfilArtistaId: 'a1',
                    titulo: { contains: 'concierto', mode: 'insensitive' }
                },
                skip: 10,
                take: 10
            }));
        });
    });
});