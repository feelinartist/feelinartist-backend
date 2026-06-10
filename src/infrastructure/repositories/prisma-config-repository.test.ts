import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RepositorioConfigPrisma } from './prisma-config-repository';
import prisma from '../database/prisma';

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
        vi.resetAllMocks();
        repository = new RepositorioConfigPrisma();
    });

    describe('Redes Sociales', () => {
        it('listarRedesSociales: should retrieve active social networks ordered by name', async () => {
            const mockSocials = [
                { id: '1', nombre: 'Facebook', estado: 'ACTIVO' },
                { id: '2', nombre: 'Instagram', estado: 'ACTIVO' }
            ];
            vi.mocked((prisma as any).redSocial.findMany).mockResolvedValue(mockSocials);

            const result = await repository.listarRedesSociales();

            expect((prisma as any).redSocial.findMany).toHaveBeenCalledWith({
                where: { estado: 'ACTIVO' },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockSocials);
        });

        it('crearRedSocial: should create social network', async () => {
            const data = { nombre: 'Twitter', urlBase: 'https://twitter.com', icono: 'twitter-icon' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).redSocial.create).mockResolvedValue(mockCreated);

            const result = await repository.crearRedSocial(data);

            expect((prisma as any).redSocial.create).toHaveBeenCalledWith({ data });
            expect(result).toEqual(mockCreated);
        });

        it('actualizarRedSocial: should update social network details', async () => {
            const data = { nombre: 'X' };
            const mockUpdated = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', estado: 'ACTIVO' };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockUpdated);

            const result = await repository.actualizarRedSocial('3', data);

            expect((prisma as any).redSocial.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarRedSocial: should soft delete social network by setting estado to INACTIVO', async () => {
            const mockDeleted = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', estado: 'INACTIVO' };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockDeleted);

            const result = await repository.eliminarRedSocial('3');

            expect((prisma as any).redSocial.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { estado: 'INACTIVO' }
            });
            expect(result).toEqual(mockDeleted);
        });
    });

    describe('Metodos Donacion', () => {
        it('listarMetodosDonacion: should retrieve active donation methods ordered by name', async () => {
            const mockMethods = [
                { id: '1', nombre: 'Paypal', estado: 'ACTIVO' },
                { id: '2', nombre: 'Stripe', estado: 'ACTIVO' }
            ];
            vi.mocked((prisma as any).metodoDonacion.findMany).mockResolvedValue(mockMethods);

            const result = await repository.listarMetodosDonacion();

            expect((prisma as any).metodoDonacion.findMany).toHaveBeenCalledWith({
                where: { estado: 'ACTIVO' },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockMethods);
        });

        it('crearMetodoDonacion: should create donation method', async () => {
            const data = { nombre: 'Patreon', icono: 'patreon-icon' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.create).mockResolvedValue(mockCreated);

            const result = await repository.crearMetodoDonacion(data);

            expect((prisma as any).metodoDonacion.create).toHaveBeenCalledWith({ data });
            expect(result).toEqual(mockCreated);
        });

        it('actualizarMetodoDonacion: should update donation method details', async () => {
            const data = { nombre: 'Patreon Business' };
            const mockUpdated = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', estado: 'ACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockUpdated);

            const result = await repository.actualizarMetodoDonacion('3', data);

            expect((prisma as any).metodoDonacion.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarMetodoDonacion: should soft delete donation method by setting estado to INACTIVO', async () => {
            const mockDeleted = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', estado: 'INACTIVO' };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockDeleted);

            const result = await repository.eliminarMetodoDonacion('3');

            expect((prisma as any).metodoDonacion.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { estado: 'INACTIVO' }
            });
            expect(result).toEqual(mockDeleted);
        });
    });

    describe('Categorias Artista', () => {
        it('listarCategoriasArtista: should retrieve active categories ordered by name', async () => {
            const mockCats = [
                { id: '1', nombre: 'Banda', estado: 'ACTIVO' },
                { id: '2', nombre: 'DJ', estado: 'ACTIVO' }
            ];
            vi.mocked((prisma as any).categoriaArtista.findMany).mockResolvedValue(mockCats);

            const result = await repository.listarCategoriasArtista();

            expect((prisma as any).categoriaArtista.findMany).toHaveBeenCalledWith({
                where: { estado: 'ACTIVO' },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockCats);
        });

        it('crearCategoriaArtista: should create category', async () => {
            const data = { nombre: 'Banda' };
            const mockCreated = { id: '3', ...data, estado: 'ACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.create).mockResolvedValue(mockCreated);

            const result = await repository.crearCategoriaArtista(data);

            expect((prisma as any).categoriaArtista.create).toHaveBeenCalledWith({ data });
            expect(result).toEqual(mockCreated);
        });

        it('actualizarCategoriaArtista: should update category details', async () => {
            const data = { nombre: 'Banda Actualizada' };
            const mockUpdated = { id: '3', nombre: 'Banda Actualizada', estado: 'ACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.update).mockResolvedValue(mockUpdated);

            const result = await repository.actualizarCategoriaArtista('3', data);

            expect((prisma as any).categoriaArtista.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarCategoriaArtista: should soft delete category by setting estado to INACTIVO', async () => {
            const mockDeleted = { id: '3', nombre: 'Banda', estado: 'INACTIVO' };
            vi.mocked((prisma as any).categoriaArtista.update).mockResolvedValue(mockDeleted);

            const result = await repository.eliminarCategoriaArtista('3');

            expect((prisma as any).categoriaArtista.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { estado: 'INACTIVO' }
            });
            expect(result).toEqual(mockDeleted);
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
