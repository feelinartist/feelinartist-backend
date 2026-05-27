import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaPedidoRepository } from './prisma-pedido-repository';
import prisma from '../database/prisma';
import { redisService } from '../services/redis-service';
import { EstadoPedidoCancion } from '@prisma/client';

vi.mock('../services/redis-service', () => {
    return {
        redisService: {
            incr: vi.fn(),
            zincrby: vi.fn(),
            zadd: vi.fn(),
            set: vi.fn(),
            get: vi.fn(),
            del: vi.fn(),
            zrem: vi.fn(),
            zrevrangeWithScores: vi.fn(),
            zrevrange: vi.fn(),
            hsetnx: vi.fn(),
            hincrby: vi.fn(),
        }
    };
});

describe('PrismaPedidoRepository', () => {
    let repository: PrismaPedidoRepository;

    beforeEach(() => {
        vi.resetAllMocks();
        repository = new PrismaPedidoRepository();
    });

    describe('crearPedido', () => {
        it('should create order and update Redis successfully', async () => {
            const datos = {
                eventoId: 'evento-1',
                titulo: 'Song A',
                artista: 'Artist A',
                usuarioId: 'user-1',
                itunesId: 'itunes-1',
                nombreSolicitante: 'John Doe',
                genero: 'Pop',
                imagenUrl: 'http://img.url',
                previewUrl: 'http://preview.url',
            };

            const mockEvento = { perfilArtistaId: 'artista-perfil-1' };
            const mockPedido = {
                id: 'pedido-1',
                eventoId: 'evento-1',
                titulo: 'Song A',
                artista: 'Artist A',
                usuarioId: 'user-1',
                itunesId: 'itunes-1',
                nombreSolicitante: 'John Doe',
                genero: 'Pop',
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                perfilArtistaId: 'artista-perfil-1',
                creadoEn: new Date(),
            };

            vi.mocked(prisma.evento.findUnique).mockResolvedValue(mockEvento as any);
            vi.mocked(prisma.pedidoCancion.create).mockResolvedValue(mockPedido as any);
            vi.mocked(redisService.incr).mockResolvedValue(1 as any);
            vi.mocked(redisService.zincrby).mockResolvedValue(1 as any);
            vi.mocked(redisService.zadd).mockResolvedValue(1 as any);
            vi.mocked(redisService.set).mockResolvedValue('OK' as any);

            const result = await repository.crearPedido(datos);

            expect(prisma.evento.findUnique).toHaveBeenCalledWith({
                where: { id: 'evento-1' },
                select: { perfilArtistaId: true }
            });
            expect(prisma.pedidoCancion.create).toHaveBeenCalledWith({
                data: {
                    eventoId: 'evento-1',
                    titulo: 'Song A',
                    artista: 'Artist A',
                    usuarioId: 'user-1',
                    itunesId: 'itunes-1',
                    nombreSolicitante: 'John Doe',
                    genero: 'Pop',
                    estado: 'PENDIENTE',
                    perfilArtistaId: 'artista-perfil-1'
                }
            });
            expect(redisService.incr).toHaveBeenCalledWith('event:evento-1:orders:total');
            expect(redisService.incr).toHaveBeenCalledWith('stats:orders:total');
            expect(redisService.zincrby).toHaveBeenCalledWith(
                'event:evento-1:popularity_ranking',
                1,
                JSON.stringify({
                    titulo: 'Song A',
                    artista: 'Artist A',
                    itunesId: 'itunes-1',
                    genero: 'Pop',
                    imagenUrl: 'http://img.url',
                    previewUrl: 'http://preview.url',
                })
            );
            expect(redisService.zadd).toHaveBeenCalled();
            expect(redisService.set).toHaveBeenCalled();
            expect(result).toEqual(mockPedido);
        });

        it('should throw Error if event does not exist', async () => {
            vi.mocked(prisma.evento.findUnique).mockResolvedValue(null);

            await expect(repository.crearPedido({ eventoId: 'non-existent', titulo: 'Song' }))
                .rejects.toThrow('Evento no encontrado');
        });

        it('should catch Redis errors during creation and log warning', async () => {
            const datos = {
                eventoId: 'evento-1',
                titulo: 'Song A',
            };

            const mockEvento = { perfilArtistaId: 'artista-perfil-1' };
            const mockPedido = {
                id: 'pedido-1',
                eventoId: 'evento-1',
                titulo: 'Song A',
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                perfilArtistaId: 'artista-perfil-1',
                creadoEn: new Date(),
            };

            vi.mocked(prisma.evento.findUnique).mockResolvedValue(mockEvento as any);
            vi.mocked(prisma.pedidoCancion.create).mockResolvedValue(mockPedido as any);
            vi.mocked(redisService.incr).mockRejectedValue(new Error('Redis is down'));

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await repository.crearPedido(datos);

            expect(result).toEqual(mockPedido);
            expect(warnSpy).toHaveBeenCalledWith('Error updating popularity ranking in Redis:', expect.any(Error));

            warnSpy.mockRestore();
        });
    });

    describe('obtenerPedidosPorEvento', () => {
        it('should return parsed ranking list if popularity ranking in Redis exists', async () => {
            const mockRanking = [
                {
                    member: JSON.stringify({
                        titulo: 'Song A',
                        artista: 'Artist A',
                        itunesId: 'itunes-1',
                    }),
                    score: 5
                }
            ];
            vi.mocked(redisService.zrevrangeWithScores).mockResolvedValue(mockRanking as any);

            const result = await repository.obtenerPedidosPorEvento('evento-1');

            expect(redisService.zrevrangeWithScores).toHaveBeenCalledWith('event:evento-1:popularity_ranking', 0, 49);
            expect(result).toEqual([
                {
                    titulo: 'Song A',
                    artista: 'Artist A',
                    itunesId: 'itunes-1',
                    votos: 5,
                    esRanking: true
                }
            ]);
            expect(redisService.zrevrange).not.toHaveBeenCalled();
            expect(prisma.pedidoCancion.findMany).not.toHaveBeenCalled();
        });

        it('should return live queue if ranking fails and live queue exists', async () => {
            const mockLiveQueue = [
                JSON.stringify({
                    id: 'pedido-1',
                    titulo: 'Song A',
                    artista: 'Artist A',
                })
            ];

            vi.mocked(redisService.zrevrangeWithScores).mockRejectedValue(new Error('Redis error'));
            vi.mocked(redisService.zrevrange).mockResolvedValue(mockLiveQueue as any);
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await repository.obtenerPedidosPorEvento('evento-1');

            expect(redisService.zrevrange).toHaveBeenCalledWith('event:evento-1:live_queue', 0, 99);
            expect(result).toEqual([
                {
                    id: 'pedido-1',
                    titulo: 'Song A',
                    artista: 'Artist A',
                }
            ]);
            expect(prisma.pedidoCancion.findMany).not.toHaveBeenCalled();
            expect(warnSpy).toHaveBeenCalledTimes(1);
            warnSpy.mockRestore();
        });

        it('should fallback to DB if Redis lookups fail or return empty', async () => {
            const mockDbResult = [
                { id: 'pedido-1', titulo: 'Song A', estado: 'PENDIENTE' }
            ];

            vi.mocked(redisService.zrevrangeWithScores).mockResolvedValue([]);
            vi.mocked(redisService.zrevrange).mockResolvedValue([]);
            vi.mocked(prisma.pedidoCancion.findMany).mockResolvedValue(mockDbResult as any);

            const result = await repository.obtenerPedidosPorEvento('evento-1');

            expect(prisma.pedidoCancion.findMany).toHaveBeenCalledWith({
                where: {
                    eventoId: 'evento-1',
                    estado: 'PENDIENTE'
                },
                take: 100,
                orderBy: { creadoEn: 'desc' }
            });
            expect(result).toEqual(mockDbResult);
        });

        it('should fallback to DB if both Redis operations throw error', async () => {
            const mockDbResult = [
                { id: 'pedido-1', titulo: 'Song A', estado: 'PENDIENTE' }
            ];

            vi.mocked(redisService.zrevrangeWithScores).mockRejectedValue(new Error('error 1'));
            vi.mocked(redisService.zrevrange).mockRejectedValue(new Error('error 2'));
            vi.mocked(prisma.pedidoCancion.findMany).mockResolvedValue(mockDbResult as any);

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await repository.obtenerPedidosPorEvento('evento-1');

            expect(result).toEqual(mockDbResult);
            expect(warnSpy).toHaveBeenCalledTimes(2);
            warnSpy.mockRestore();
        });
    });

    describe('actualizarEstado', () => {
        it('should throw error if pedido does not exist', async () => {
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(null);

            await expect(repository.actualizarEstado('pedido-1', 'ACEPTADO'))
                .rejects.toThrow('Pedido no encontrado');
        });

        it('should return early if state is same', async () => {
            const mockPedido = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedido as any);

            const result = await repository.actualizarEstado('pedido-1', 'PENDIENTE');

            expect(result).toEqual(mockPedido);
            expect(prisma.pedidoCancion.update).not.toHaveBeenCalled();
        });

        it('should update state and trigger Redis queue cleanup and stats buffer', async () => {
            const mockPedidoAnterior = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
                genero: 'Pop',
            };
            const mockPedidoActualizado = {
                id: 'pedido-1',
                estado: 'ACEPTADO' as EstadoPedidoCancion,
            };

            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue(mockPedidoActualizado as any);
            vi.mocked(redisService.get).mockResolvedValue('live-data');
            vi.mocked(redisService.zrem).mockResolvedValue(1 as any);
            vi.mocked(redisService.del).mockResolvedValue(1 as any);

            const result = await repository.actualizarEstado('pedido-1', 'ACEPTADO');

            expect(prisma.pedidoCancion.update).toHaveBeenCalledWith({
                where: { id: 'pedido-1' },
                data: { estado: 'ACEPTADO' }
            });
            expect(redisService.get).toHaveBeenCalledWith('request:payload:pedido-1');
            expect(redisService.zrem).toHaveBeenCalledWith('event:evento-1:live_queue', 'live-data');
            expect(redisService.del).toHaveBeenCalledWith('request:payload:pedido-1');

            expect(redisService.hsetnx).toHaveBeenCalledWith('stats:buffer:itunes-1', 'perfilArtistaId', 'perfil-1');
            expect(redisService.hsetnx).toHaveBeenCalledWith('stats:buffer:itunes-1', 'titulo', 'Song');
            expect(redisService.hsetnx).toHaveBeenCalledWith('stats:buffer:itunes-1', 'artista', 'Artist');
            expect(redisService.hsetnx).toHaveBeenCalledWith('stats:buffer:itunes-1', 'genero', 'Pop');
            expect(redisService.hincrby).toHaveBeenCalledWith('stats:buffer:itunes-1', 'accepted', 1);
            expect(redisService.hincrby).not.toHaveBeenCalledWith('stats:buffer:itunes-1', 'rejected', expect.any(Number));

            expect(result).toEqual(mockPedidoActualizado);
        });

        it('should skip Redis cleanup when perfilArtistaId or eventoId are missing', async () => {
            const mockPedidoAnterior = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: null, // missing perfilArtistaId
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);

            await repository.actualizarEstado('pedido-1', 'ACEPTADO');

            expect(redisService.get).not.toHaveBeenCalled();
            expect(redisService.hsetnx).not.toHaveBeenCalled(); // also skips stats buffer since perfilArtistaId is missing
        });

        it('should skip stats buffering when artist info is missing', async () => {
            const mockPedidoAnterior = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: null, // missing titulo
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);
            vi.mocked(redisService.get).mockResolvedValue('live-data');

            await repository.actualizarEstado('pedido-1', 'ACEPTADO');

            expect(redisService.get).toHaveBeenCalled(); // cleanup runs because perfilArtistaId and eventoId exist
            expect(redisService.hsetnx).not.toHaveBeenCalled(); // buffer statistics skipped
        });

        it('should handle Redis cleanup errors gracefully', async () => {
            const mockPedidoAnterior = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);
            vi.mocked(redisService.get).mockRejectedValue(new Error('Redis get error'));

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await repository.actualizarEstado('pedido-1', 'ACEPTADO');

            expect(warnSpy).toHaveBeenCalledWith('Error cleaning up Redis queue:', expect.any(Error));
            warnSpy.mockRestore();
        });

        it('should handle Redis buffer errors gracefully', async () => {
            const mockPedidoAnterior = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);
            vi.mocked(redisService.hsetnx).mockRejectedValue(new Error('Redis hsetnx error'));

            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await repository.actualizarEstado('pedido-1', 'ACEPTADO');

            expect(errorSpy).toHaveBeenCalledWith('Error buffering stats to Redis:', expect.any(Error));
            errorSpy.mockRestore();
        });

        it('should handle buffer statistics decrements and increments for different state changes', async () => {
            const mockPedidoAnterior = {
                estado: 'ACEPTADO' as EstadoPedidoCancion,
                itunesId: null,
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
                genero: null,
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);

            await repository.actualizarEstado('pedido-1', 'RECHAZADO');

            const bufferKey = 'stats:buffer:manual_Song_Artist';
            expect(redisService.hsetnx).toHaveBeenCalledWith(bufferKey, 'perfilArtistaId', 'perfil-1');
            expect(redisService.hsetnx).toHaveBeenCalledWith(bufferKey, 'titulo', 'Song');
            expect(redisService.hsetnx).toHaveBeenCalledWith(bufferKey, 'artista', 'Artist');
            expect(redisService.hsetnx).not.toHaveBeenCalledWith(bufferKey, 'genero', expect.any(String));

            expect(redisService.hincrby).toHaveBeenCalledWith(bufferKey, 'accepted', -1);
            expect(redisService.hincrby).toHaveBeenCalledWith(bufferKey, 'rejected', 1);
        });

        it('should handle buffer statistics for old state RECHAZADO -> new state other (PENDIENTE)', async () => {
            const mockPedidoAnterior = {
                estado: 'RECHAZADO' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);

            await repository.actualizarEstado('pedido-1', 'PENDIENTE');

            const bufferKey = 'stats:buffer:itunes-1';
            expect(redisService.hincrby).toHaveBeenCalledWith(bufferKey, 'rejected', -1);
            expect(redisService.hincrby).not.toHaveBeenCalledWith(bufferKey, 'accepted', expect.any(Number));
        });
    });

    describe('limpiarColaVivaRedis', () => {
        it('should log warning if shadow key payload is missing', async () => {
            const mockPedidoAnterior = {
                estado: 'PENDIENTE' as EstadoPedidoCancion,
                itunesId: 'itunes-1',
                titulo: 'Song',
                artista: 'Artist',
                perfilArtistaId: 'perfil-1',
                eventoId: 'evento-1',
            };
            vi.mocked(prisma.pedidoCancion.findUnique).mockResolvedValue(mockPedidoAnterior as any);
            vi.mocked(prisma.pedidoCancion.update).mockResolvedValue({ id: 'pedido-1' } as any);
            vi.mocked(redisService.get).mockResolvedValue(null);

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await repository.actualizarEstado('pedido-1', 'ACEPTADO');

            expect(warnSpy).toHaveBeenCalledWith('[Redis] Shadow key missing for cleanup: request:payload:pedido-1');
            warnSpy.mockRestore();
        });
    });
});
