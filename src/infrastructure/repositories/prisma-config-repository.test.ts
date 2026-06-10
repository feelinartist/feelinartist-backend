import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositorioConfigPrisma } from './prisma-config-repository';
import prisma from '../database/prisma';
import { redisService } from '../services/redis-service';

// Dynamically inject missing collections on the mocked Prisma client
(prisma as any).redSocial = {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
};

(prisma as any).metodoDonacion = {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
};

(prisma as any).categoriaArtista = {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
};

(prisma as any).rol = {
    findMany: vi.fn(),
};

describe('RepositorioConfigPrisma', () => {
    let repository: RepositorioConfigPrisma;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
        repository = new RepositorioConfigPrisma();
    });

    describe('Redes Sociales', () => {
        it('listarRedesSociales: should retrieve active social networks ordered by name', async () => {
            const mockSocials = [
                { id: '1', nombre: 'Facebook', estado: 'ACTIVO' },
                { id: '2', nombre: 'Instagram', estado: 'ACTIVO' }
            ];
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(null);
            vi.spyOn(redisService, 'set').mockResolvedValue(undefined as any);
            vi.mocked((prisma as any).redSocial.findMany).mockResolvedValue(mockSocials);

            const result = await repository.listarRedesSociales();

            expect((prisma as any).redSocial.findMany).toHaveBeenCalledWith({
                where: { estado: 'ACTIVO' },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockSocials);
        });

        it('listarRedesSociales: should return cached values if they exist in Redis', async () => {
            const mockSocials = [
                { id: '1', nombre: 'Facebook', estado: 'ACTIVO' }
            ];
            const redisGetSpy = vi.spyOn(redisService, 'get').mockResolvedValueOnce(JSON.stringify(mockSocials));

            const result = await repository.listarRedesSociales();

            expect(redisGetSpy).toHaveBeenCalledWith('config:redes_sociales');
            expect((prisma as any).redSocial.findMany).not.toHaveBeenCalled();
            expect(result).toEqual(mockSocials);
        });

        it('listarRedesSociales: should call database and set cache if Redis cache is miss', async () => {
            const mockSocials = [
                { id: '1', nombre: 'Facebook', estado: 'ACTIVO' }
            ];
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(null);
            const redisSetSpy = vi.spyOn(redisService, 'set').mockResolvedValueOnce(undefined as any);
            vi.mocked((prisma as any).redSocial.findMany).mockResolvedValue(mockSocials);

            const result = await repository.listarRedesSociales();

            expect(redisSetSpy).toHaveBeenCalledWith('config:redes_sociales', JSON.stringify(mockSocials), 3600);
            expect(result).toEqual(mockSocials);
        });

        it('listarRedesSociales: should ignore cache reading/writing errors and query database', async () => {
            const mockSocials = [{ id: '1', nombre: 'Facebook', estado: 'ACTIVO' }];
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(redisService, 'get').mockRejectedValueOnce(new Error('Redis get error'));
            vi.spyOn(redisService, 'set').mockRejectedValueOnce(new Error('Redis set error'));
            vi.mocked((prisma as any).redSocial.findMany).mockResolvedValue(mockSocials);

            const result = await repository.listarRedesSociales();

            expect(consoleSpy).toHaveBeenCalledWith('Error reading redes sociales cache:', expect.any(Error));
            expect(consoleSpy).toHaveBeenCalledWith('Error writing redes sociales cache:', expect.any(Error));
            expect(result).toEqual(mockSocials);
            consoleSpy.mockRestore();
        });

        it('crearRedSocial: should create social network and clear cache', async () => {
            const data = { nombre: 'Twitter', urlBase: 'https://twitter.com', icono: 'twitter-icon' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).redSocial.create).mockResolvedValue(mockCreated);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.crearRedSocial(data);

            expect((prisma as any).redSocial.create).toHaveBeenCalledWith({ data });
            expect(redisDelSpy).toHaveBeenCalledWith('config:redes_sociales');
            expect(result).toEqual(mockCreated);
        });

        it('crearRedSocial: should log error if cache deletion fails', async () => {
            const data = { nombre: 'Twitter', urlBase: 'https://twitter.com' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).redSocial.create).mockResolvedValue(mockCreated);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await repository.crearRedSocial(data);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting redes sociales cache:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('actualizarRedSocial: should update social network details and clear cache', async () => {
            const data = { nombre: 'X' };
            const mockUpdated = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', estado: 'ACTIVO' };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockUpdated);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.actualizarRedSocial('3', data);

            expect((prisma as any).redSocial.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(redisDelSpy).toHaveBeenCalledWith('config:redes_sociales');
            expect(result).toEqual(mockUpdated);
        });

        it('actualizarRedSocial: should log error if cache deletion fails', async () => {
            const data = { nombre: 'X' };
            const mockUpdated = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', estado: 'ACTIVO' };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockUpdated);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await repository.actualizarRedSocial('3', data);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting redes sociales cache:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('eliminarRedSocial: should soft delete social network by setting estado to INACTIVO and clear cache', async () => {
            const mockDeleted = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', estado: 'INACTIVO' };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockDeleted);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.eliminarRedSocial('3');

            expect((prisma as any).redSocial.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { estado: 'INACTIVO' }
            });
            expect(redisDelSpy).toHaveBeenCalledWith('config:redes_sociales');
            expect(result).toEqual(mockDeleted);
        });

        it('eliminarRedSocial: should log error if cache deletion fails', async () => {
            const mockDeleted = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', estado: 'INACTIVO' };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockDeleted);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await repository.eliminarRedSocial('3');

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting redes sociales cache:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Metodos Donacion', () => {
        it('listarMetodosDonacion: should retrieve active donation methods ordered by name', async () => {
            const mockMethods = [
                { id: '1', nombre: 'Paypal', estado: 'ACTIVO' },
                { id: '2', nombre: 'Stripe', estado: 'ACTIVO' }
            ];
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(null);
            vi.spyOn(redisService, 'set').mockResolvedValue(undefined as any);
            vi.mocked((prisma as any).metodoDonacion.findMany).mockResolvedValue(mockMethods);

            const result = await repository.listarMetodosDonacion();

            expect((prisma as any).metodoDonacion.findMany).toHaveBeenCalledWith({
                where: { estado: 'ACTIVO' },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockMethods);
        });

        it('listarMetodosDonacion: should return cached values if they exist in Redis', async () => {
            const mockMethods = [{ id: '1', nombre: 'Paypal', estado: 'ACTIVO' }];
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(JSON.stringify(mockMethods));

            const result = await repository.listarMetodosDonacion();

            expect(result).toEqual(mockMethods);
        });

        it('listarMetodosDonacion: should ignore cache errors on list', async () => {
            const mockMethods = [{ id: '1', nombre: 'Paypal', estado: 'ACTIVO' }];
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(redisService, 'get').mockRejectedValueOnce(new Error('Redis get error'));
            vi.mocked((prisma as any).metodoDonacion.findMany).mockResolvedValue(mockMethods);

            const result = await repository.listarMetodosDonacion();

            expect(consoleSpy).toHaveBeenCalledWith('Error reading metodos donacion cache:', expect.any(Error));
            expect(result).toEqual(mockMethods);
            consoleSpy.mockRestore();
        });

        it('crearMetodoDonacion: should create donation method and clear cache', async () => {
            const data = { nombre: 'Patreon', icono: 'patreon-icon' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.create).mockResolvedValue(mockCreated);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.crearMetodoDonacion(data);

            expect((prisma as any).metodoDonacion.create).toHaveBeenCalledWith({ data });
            expect(redisDelSpy).toHaveBeenCalledWith('config:metodos_donacion');
            expect(result).toEqual(mockCreated);
        });

        it('actualizarMetodoDonacion: should update donation method details and clear cache', async () => {
            const data = { nombre: 'Patreon Business' };
            const mockUpdated = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', estado: 'ACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockUpdated);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.actualizarMetodoDonacion('3', data);

            expect((prisma as any).metodoDonacion.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(redisDelSpy).toHaveBeenCalledWith('config:metodos_donacion');
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarMetodoDonacion: should soft delete donation method and clear cache', async () => {
            const mockDeleted = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', estado: 'INACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockDeleted);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.eliminarMetodoDonacion('3');

            expect((prisma as any).metodoDonacion.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { estado: 'INACTIVO' }
            });
            expect(redisDelSpy).toHaveBeenCalledWith('config:metodos_donacion');
            expect(result).toEqual(mockDeleted);
        });

        it('listarMetodosDonacion: should log error if cache writing fails', async () => {
            const mockMethods = [{ id: '1', nombre: 'Paypal', estado: 'ACTIVO' }];
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(null);
            vi.spyOn(redisService, 'set').mockRejectedValueOnce(new Error('Redis set error'));
            vi.mocked((prisma as any).metodoDonacion.findMany).mockResolvedValue(mockMethods);

            const result = await repository.listarMetodosDonacion();

            expect(consoleSpy).toHaveBeenCalledWith('Error writing metodos donacion cache:', expect.any(Error));
            expect(result).toEqual(mockMethods);
            consoleSpy.mockRestore();
        });

        it('crearMetodoDonacion: should log error if cache deletion fails', async () => {
            const data = { nombre: 'Patreon', icono: 'patreon-icon' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.create).mockResolvedValue(mockCreated);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.crearMetodoDonacion(data);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting metodos donacion cache:', expect.any(Error));
            expect(result).toEqual(mockCreated);
            consoleSpy.mockRestore();
        });

        it('actualizarMetodoDonacion: should log error if cache deletion fails', async () => {
            const data = { nombre: 'Patreon Business' };
            const mockUpdated = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', estado: 'ACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockUpdated);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.actualizarMetodoDonacion('3', data);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting metodos donacion cache:', expect.any(Error));
            expect(result).toEqual(mockUpdated);
            consoleSpy.mockRestore();
        });

        it('eliminarMetodoDonacion: should log error if cache deletion fails', async () => {
            const mockDeleted = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', estado: 'INACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockDeleted);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.eliminarMetodoDonacion('3');

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting metodos donacion cache:', expect.any(Error));
            expect(result).toEqual(mockDeleted);
            consoleSpy.mockRestore();
        });
    });

    describe('Categorias Artista', () => {
        it('listarCategoriasArtista: should retrieve active categories ordered by name', async () => {
            const mockCats = [
                { id: '1', nombre: 'Banda', estado: 'ACTIVO' },
                { id: '2', nombre: 'DJ', estado: 'ACTIVO' }
            ];
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(null);
            vi.spyOn(redisService, 'set').mockResolvedValue(undefined as any);
            vi.mocked((prisma as any).categoriaArtista.findMany).mockResolvedValue(mockCats);

            const result = await repository.listarCategoriasArtista();

            expect((prisma as any).categoriaArtista.findMany).toHaveBeenCalledWith({
                where: { estado: 'ACTIVO' },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockCats);
        });

        it('listarCategoriasArtista: should return cached values if they exist in Redis', async () => {
            const mockCats = [{ id: '1', nombre: 'Banda', estado: 'ACTIVO' }];
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(JSON.stringify(mockCats));

            const result = await repository.listarCategoriasArtista();

            expect(result).toEqual(mockCats);
        });

        it('listarCategoriasArtista: should ignore cache errors on list', async () => {
            const mockCats = [{ id: '1', nombre: 'Banda', estado: 'ACTIVO' }];
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(redisService, 'get').mockRejectedValueOnce(new Error('Redis get error'));
            vi.mocked((prisma as any).categoriaArtista.findMany).mockResolvedValue(mockCats);

            const result = await repository.listarCategoriasArtista();

            expect(consoleSpy).toHaveBeenCalledWith('Error reading categorias artista cache:', expect.any(Error));
            expect(result).toEqual(mockCats);
            consoleSpy.mockRestore();
        });

        it('crearCategoriaArtista: should create category and clear cache', async () => {
            const data = { nombre: 'Banda' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.create).mockResolvedValue(mockCreated);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.crearCategoriaArtista(data);

            expect((prisma as any).categoriaArtista.create).toHaveBeenCalledWith({ data });
            expect(redisDelSpy).toHaveBeenCalledWith('config:categorias_artista');
            expect(result).toEqual(mockCreated);
        });

        it('actualizarCategoriaArtista: should update category details and clear cache', async () => {
            const data = { nombre: 'Banda Actualizada' };
            const mockUpdated = { id: '3', nombre: 'Banda Actualizada', estado: 'ACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.update).mockResolvedValue(mockUpdated);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.actualizarCategoriaArtista('3', data);

            expect((prisma as any).categoriaArtista.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(redisDelSpy).toHaveBeenCalledWith('config:categorias_artista');
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarCategoriaArtista: should soft delete category and clear cache', async () => {
            const mockDeleted = { id: '3', nombre: 'Banda', estado: 'INACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.update).mockResolvedValue(mockDeleted);
            const redisDelSpy = vi.spyOn(redisService, 'del').mockResolvedValue(undefined as any);

            const result = await repository.eliminarCategoriaArtista('3');

            expect((prisma as any).categoriaArtista.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { estado: 'INACTIVO' }
            });
            expect(redisDelSpy).toHaveBeenCalledWith('config:categorias_artista');
            expect(result).toEqual(mockDeleted);
        });

        it('listarCategoriasArtista: should log error if cache writing fails', async () => {
            const mockCats = [{ id: '1', nombre: 'Banda', estado: 'ACTIVO' }];
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(redisService, 'get').mockResolvedValueOnce(null);
            vi.spyOn(redisService, 'set').mockRejectedValueOnce(new Error('Redis set error'));
            vi.mocked((prisma as any).categoriaArtista.findMany).mockResolvedValue(mockCats);

            const result = await repository.listarCategoriasArtista();

            expect(consoleSpy).toHaveBeenCalledWith('Error writing categorias artista cache:', expect.any(Error));
            expect(result).toEqual(mockCats);
            consoleSpy.mockRestore();
        });

        it('crearCategoriaArtista: should log error if cache deletion fails', async () => {
            const data = { nombre: 'Banda' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.create).mockResolvedValue(mockCreated);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.crearCategoriaArtista(data);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting categorias artista cache:', expect.any(Error));
            expect(result).toEqual(mockCreated);
            consoleSpy.mockRestore();
        });

        it('actualizarCategoriaArtista: should log error if cache deletion fails', async () => {
            const data = { nombre: 'Banda Actualizada' };
            const mockUpdated = { id: '3', nombre: 'Banda Actualizada', estado: 'ACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.update).mockResolvedValue(mockUpdated);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.actualizarCategoriaArtista('3', data);

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting categorias artista cache:', expect.any(Error));
            expect(result).toEqual(mockUpdated);
            consoleSpy.mockRestore();
        });

        it('eliminarCategoriaArtista: should log error if cache deletion fails', async () => {
            const mockDeleted = { id: '3', nombre: 'Banda', estado: 'INACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.update).mockResolvedValue(mockDeleted);
            vi.spyOn(redisService, 'del').mockRejectedValueOnce(new Error('Redis delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.eliminarCategoriaArtista('3');

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting categorias artista cache:', expect.any(Error));
            expect(result).toEqual(mockDeleted);
            consoleSpy.mockRestore();
        });
    });

    describe('Roles', () => {
        it('listarRoles: should retrieve all roles and map them to domain structure', async () => {
            const mockPrismaRoles = [
                { id: '1', nombre: 'ADMIN', descripcion: 'Administrator' },
                { id: '2', nombre: 'ARTISTA', descripcion: 'Artist' }
            ];
            vi.mocked((prisma as any).rol.findMany).mockResolvedValue(mockPrismaRoles);

            const result = await repository.listarRoles();

            expect((prisma as any).rol.findMany).toHaveBeenCalledWith({
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual([
                { id: '1', nombre: 'ADMIN' },
                { id: '2', nombre: 'ARTISTA' }
            ]);
        });
    });
});
