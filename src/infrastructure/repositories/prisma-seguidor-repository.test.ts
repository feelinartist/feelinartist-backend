import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositorioSeguidorPrisma } from './prisma-seguidor-repository';
import prisma from '../database/prisma';

// Dynamically inject missing seguidor functions on the mocked Prisma client
(prisma.seguidor as any).create = vi.fn();
(prisma.seguidor as any).count = vi.fn();
(prisma.seguidor as any).findMany = vi.fn();

describe('RepositorioSeguidorPrisma', () => {
    let repository: RepositorioSeguidorPrisma;

    beforeEach(() => {
        vi.resetAllMocks();
        repository = new RepositorioSeguidorPrisma();
    });

    describe('seguir', () => {
        it('should follow ARTISTA if profile exists', async () => {
            const mockArtista = { id: 'artista-1', usuarioId: 'seguido-1' };
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(mockArtista as any);
            vi.mocked((prisma.seguidor as any).create).mockResolvedValue({} as any);

            await repository.seguir('seguidor-1', 'seguido-1', 'ARTISTA');

            expect(prisma.perfilArtista.findUnique).toHaveBeenCalledWith({ where: { usuarioId: 'seguido-1' } });
            expect((prisma.seguidor as any).create).toHaveBeenCalledWith({
                data: {
                    seguidorId: 'seguidor-1',
                    artistaSeguidoId: 'artista-1'
                }
            });
        });

        it('should throw error if followed ARTISTA does not exist', async () => {
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            await expect(repository.seguir('seguidor-1', 'seguido-1', 'ARTISTA'))
                .rejects.toThrow('Artista no encontrado');
        });

        it('should follow DISCOTECA if profile exists', async () => {
            const mockDiscoteca = { id: 'discoteca-1', usuarioId: 'seguido-2' };
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(mockDiscoteca as any);
            vi.mocked((prisma.seguidor as any).create).mockResolvedValue({} as any);

            await repository.seguir('seguidor-1', 'seguido-2', 'DISCOTECA');

            expect(prisma.perfilDiscoteca.findUnique).toHaveBeenCalledWith({ where: { usuarioId: 'seguido-2' } });
            expect((prisma.seguidor as any).create).toHaveBeenCalledWith({
                data: {
                    seguidorId: 'seguidor-1',
                    perfilDiscotecaId: 'discoteca-1'
                }
            });
        });

        it('should throw error if followed DISCOTECA does not exist', async () => {
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(null);

            await expect(repository.seguir('seguidor-1', 'seguido-2', 'DISCOTECA'))
                .rejects.toThrow('Discoteca no encontrada');
        });
    });

    describe('dejarDeSeguir', () => {
        it('should unfollow ARTISTA if profile exists', async () => {
            const mockArtista = { id: 'artista-1', usuarioId: 'seguido-1' };
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(mockArtista as any);
            vi.mocked(prisma.seguidor.deleteMany).mockResolvedValue({ count: 1 });

            await repository.dejarDeSeguir('seguidor-1', 'seguido-1', 'ARTISTA');

            expect(prisma.seguidor.deleteMany).toHaveBeenCalledWith({
                where: {
                    seguidorId: 'seguidor-1',
                    artistaSeguidoId: 'artista-1'
                }
            });
        });

        it('should return early on dejarDeSeguir ARTISTA if profile does not exist', async () => {
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            await repository.dejarDeSeguir('seguidor-1', 'seguido-1', 'ARTISTA');

            expect(prisma.seguidor.deleteMany).not.toHaveBeenCalled();
        });

        it('should unfollow DISCOTECA if profile exists', async () => {
            const mockDiscoteca = { id: 'discoteca-1', usuarioId: 'seguido-2' };
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(mockDiscoteca as any);
            vi.mocked(prisma.seguidor.deleteMany).mockResolvedValue({ count: 1 });

            await repository.dejarDeSeguir('seguidor-1', 'seguido-2', 'DISCOTECA');

            expect(prisma.seguidor.deleteMany).toHaveBeenCalledWith({
                where: {
                    seguidorId: 'seguidor-1',
                    perfilDiscotecaId: 'discoteca-1'
                }
            });
        });

        it('should return early on dejarDeSeguir DISCOTECA if profile does not exist', async () => {
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(null);

            await repository.dejarDeSeguir('seguidor-1', 'seguido-2', 'DISCOTECA');

            expect(prisma.seguidor.deleteMany).not.toHaveBeenCalled();
        });
    });

    describe('esSeguidor', () => {
        it('should return true if follower relation exists for ARTISTA', async () => {
            const mockArtista = { id: 'artista-1', usuarioId: 'seguido-1' };
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(mockArtista as any);
            vi.mocked((prisma.seguidor as any).count).mockResolvedValue(1);

            const result = await repository.esSeguidor('seguidor-1', 'seguido-1', 'ARTISTA');

            expect(result).toBe(true);
            expect((prisma.seguidor as any).count).toHaveBeenCalledWith({
                where: {
                    seguidorId: 'seguidor-1',
                    artistaSeguidoId: 'artista-1'
                }
            });
        });

        it('should return false if ARTISTA profile does not exist', async () => {
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            const result = await repository.esSeguidor('seguidor-1', 'seguido-1', 'ARTISTA');

            expect(result).toBe(false);
            expect((prisma.seguidor as any).count).not.toHaveBeenCalled();
        });

        it('should return true if follower relation exists for DISCOTECA', async () => {
            const mockDiscoteca = { id: 'discoteca-1', usuarioId: 'seguido-2' };
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(mockDiscoteca as any);
            vi.mocked((prisma.seguidor as any).count).mockResolvedValue(1);

            const result = await repository.esSeguidor('seguidor-1', 'seguido-2', 'DISCOTECA');

            expect(result).toBe(true);
            expect((prisma.seguidor as any).count).toHaveBeenCalledWith({
                where: {
                    seguidorId: 'seguidor-1',
                    perfilDiscotecaId: 'discoteca-1'
                }
            });
        });

        it('should return false if DISCOTECA profile does not exist', async () => {
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(null);

            const result = await repository.esSeguidor('seguidor-1', 'seguido-2', 'DISCOTECA');

            expect(result).toBe(false);
            expect((prisma.seguidor as any).count).not.toHaveBeenCalled();
        });
    });

    describe('obtenerSeguidores', () => {
        it('should return empty list if ARTISTA does not exist', async () => {
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            const result = await repository.obtenerSeguidores('artista-id', 'ARTISTA');

            expect(result).toEqual([]);
        });

        it('should retrieve and return follower users for ARTISTA', async () => {
            const mockArtista = { id: 'artista-1', usuarioId: 'seguido-1' };
            const mockSeguidores = [
                { seguidorId: 'user-a' },
                { seguidorId: 'user-b' }
            ];
            const mockUsuarios = [
                { id: 'user-a', nombre: 'A' },
                { id: 'user-b', nombre: 'B' }
            ];

            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(mockArtista as any);
            vi.mocked((prisma.seguidor as any).findMany).mockResolvedValue(mockSeguidores as any);
            vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockUsuarios as any);

            const result = await repository.obtenerSeguidores('seguido-1', 'ARTISTA');

            expect((prisma.seguidor as any).findMany).toHaveBeenCalledWith({
                where: { artistaSeguidoId: 'artista-1' }
            });
            expect(prisma.usuario.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['user-a', 'user-b'] } }
            });
            expect(result).toEqual(mockUsuarios);
        });

        it('should return empty list if DISCOTECA does not exist', async () => {
            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(null);

            const result = await repository.obtenerSeguidores('discoteca-id', 'DISCOTECA');

            expect(result).toEqual([]);
        });

        it('should retrieve and return follower users for DISCOTECA', async () => {
            const mockDiscoteca = { id: 'discoteca-1', usuarioId: 'seguido-2' };
            const mockSeguidores = [
                { seguidorId: 'user-c' }
            ];
            const mockUsuarios = [
                { id: 'user-c', nombre: 'C' }
            ];

            vi.mocked(prisma.perfilDiscoteca.findUnique).mockResolvedValue(mockDiscoteca as any);
            vi.mocked((prisma.seguidor as any).findMany).mockResolvedValue(mockSeguidores as any);
            vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockUsuarios as any);

            const result = await repository.obtenerSeguidores('seguido-2', 'DISCOTECA');

            expect((prisma.seguidor as any).findMany).toHaveBeenCalledWith({
                where: { perfilDiscotecaId: 'discoteca-1' }
            });
            expect(prisma.usuario.findMany).toHaveBeenCalledWith({
                where: { id: { in: ['user-c'] } }
            });
            expect(result).toEqual(mockUsuarios);
        });
    });

    describe('obtenerSeguidos', () => {
        it('should map seguidos correctly for artists, discotecas, and nulls', async () => {
            const mockSeguidos = [
                {
                    artista: {
                        usuario: { id: 'user-artist', nombre: 'Artist User' },
                        biografia: 'Bio'
                    }
                },
                {
                    perfilDiscoteca: {
                        usuario: { id: 'user-club', nombre: 'Club User' },
                        nombreComercial: 'Discoteca'
                    }
                },
                {
                    // Case where both are null/undefined
                }
            ];

            vi.mocked((prisma.seguidor as any).findMany).mockResolvedValue(mockSeguidos as any);

            const result = await repository.obtenerSeguidos('user-id');

            expect((prisma.seguidor as any).findMany).toHaveBeenCalledWith({
                where: { seguidorId: 'user-id' },
                include: {
                    artista: { include: { usuario: true } },
                    perfilDiscoteca: { include: { usuario: true } }
                }
            });

            expect(result).toEqual([
                {
                    tipo: 'ARTISTA',
                    id: 'user-artist',
                    nombre: 'Artist User',
                    perfil: {
                        usuario: { id: 'user-artist', nombre: 'Artist User' },
                        biografia: 'Bio'
                    }
                },
                {
                    tipo: 'DISCOTECA',
                    id: 'user-club',
                    nombre: 'Club User',
                    perfil: {
                        usuario: { id: 'user-club', nombre: 'Club User' },
                        nombreComercial: 'Discoteca'
                    }
                }
            ]);
        });
    });
});
