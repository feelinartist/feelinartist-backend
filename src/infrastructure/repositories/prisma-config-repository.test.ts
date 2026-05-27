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
                { id: '1', nombre: 'Facebook', activo: true },
                { id: '2', nombre: 'Instagram', activo: true }
            ];
            vi.mocked((prisma as any).redSocial.findMany).mockResolvedValue(mockSocials);

            const result = await repository.listarRedesSociales();

            expect((prisma as any).redSocial.findMany).toHaveBeenCalledWith({
                where: { activo: true },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockSocials);
        });

        it('crearRedSocial: should create social network', async () => {
            const data = { nombre: 'Twitter', urlBase: 'https://twitter.com', icono: 'twitter-icon' };
            const mockCreated = { id: '3', ...data, activo: true };
            vi.mocked((prisma as any).redSocial.create).mockResolvedValue(mockCreated);

            const result = await repository.crearRedSocial(data);

            expect((prisma as any).redSocial.create).toHaveBeenCalledWith({ data });
            expect(result).toEqual(mockCreated);
        });

        it('actualizarRedSocial: should update social network details', async () => {
            const data = { nombre: 'X' };
            const mockUpdated = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', activo: true };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockUpdated);

            const result = await repository.actualizarRedSocial('3', data);

            expect((prisma as any).redSocial.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarRedSocial: should soft delete social network by setting activo to false', async () => {
            const mockDeleted = { id: '3', nombre: 'X', urlBase: 'https://twitter.com', icono: 'twitter-icon', activo: false };
            vi.mocked((prisma as any).redSocial.update).mockResolvedValue(mockDeleted);

            const result = await repository.eliminarRedSocial('3');

            expect((prisma as any).redSocial.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { activo: false }
            });
            expect(result).toEqual(mockDeleted);
        });
    });

    describe('Metodos Donacion', () => {
        it('listarMetodosDonacion: should retrieve active donation methods ordered by name', async () => {
            const mockMethods = [
                { id: '1', nombre: 'Paypal', activo: true },
                { id: '2', nombre: 'Stripe', activo: true }
            ];
            vi.mocked((prisma as any).metodoDonacion.findMany).mockResolvedValue(mockMethods);

            const result = await repository.listarMetodosDonacion();

            expect((prisma as any).metodoDonacion.findMany).toHaveBeenCalledWith({
                where: { activo: true },
                orderBy: { nombre: 'asc' }
            });
            expect(result).toEqual(mockMethods);
        });

        it('crearMetodoDonacion: should create donation method', async () => {
            const data = { nombre: 'Patreon', icono: 'patreon-icon' };
            const mockCreated = { id: '3', ...data, activo: true };
            vi.mocked((prisma as any).metodoDonacion.create).mockResolvedValue(mockCreated);

            const result = await repository.crearMetodoDonacion(data);

            expect((prisma as any).metodoDonacion.create).toHaveBeenCalledWith({ data });
            expect(result).toEqual(mockCreated);
        });

        it('actualizarMetodoDonacion: should update donation method details', async () => {
            const data = { nombre: 'Patreon Business' };
            const mockUpdated = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', activo: true };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockUpdated);

            const result = await repository.actualizarMetodoDonacion('3', data);

            expect((prisma as any).metodoDonacion.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data
            });
            expect(result).toEqual(mockUpdated);
        });

        it('eliminarMetodoDonacion: should soft delete donation method by setting activo to false', async () => {
            const mockDeleted = { id: '3', nombre: 'Patreon Business', icono: 'patreon-icon', activo: false };
            vi.mocked((prisma as any).metodoDonacion.update).mockResolvedValue(mockDeleted);

            const result = await repository.eliminarMetodoDonacion('3');

            expect((prisma as any).metodoDonacion.update).toHaveBeenCalledWith({
                where: { id: '3' },
                data: { activo: false }
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
