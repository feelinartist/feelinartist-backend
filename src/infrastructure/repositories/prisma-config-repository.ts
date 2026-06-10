import { RedSocial, MetodoDonacion, CategoriaArtista } from '@prisma/client';
import { RepositorioConfig } from '../../domain/repositories/config-repository';
import { Rol } from '../../domain/entities/user';
import prisma from '../database/prisma';

export class RepositorioConfigPrisma implements RepositorioConfig {
    private readonly prisma = prisma;

    // Redes Sociales
    async listarRedesSociales(): Promise<RedSocial[]> {
        return this.prisma.redSocial.findMany({
            where: { estado: 'ACTIVO' },
            orderBy: { nombre: 'asc' }
        });
    }

    async crearRedSocial(data: { nombre: string; urlBase: string; icono?: string }): Promise<RedSocial> {
        return this.prisma.redSocial.create({ data });
    }

    async actualizarRedSocial(id: string, data: Partial<RedSocial>): Promise<RedSocial> {
        return this.prisma.redSocial.update({
            where: { id },
            data
        });
    }

    async eliminarRedSocial(id: string): Promise<RedSocial> {
        // Soft delete
        return this.prisma.redSocial.update({
            where: { id },
            data: { estado: 'INACTIVO' }
        });
    }

    // Metodos Donacion
    async listarMetodosDonacion(): Promise<MetodoDonacion[]> {
        return this.prisma.metodoDonacion.findMany({
            where: { estado: 'ACTIVO' },
            orderBy: { nombre: 'asc' }
        });
    }

    async crearMetodoDonacion(data: { nombre: string; icono?: string }): Promise<MetodoDonacion> {
        return this.prisma.metodoDonacion.create({ data });
    }

    async actualizarMetodoDonacion(id: string, data: Partial<MetodoDonacion>): Promise<MetodoDonacion> {
        return this.prisma.metodoDonacion.update({
            where: { id },
            data
        });
    }

    async eliminarMetodoDonacion(id: string): Promise<MetodoDonacion> {
        // Soft delete
        return this.prisma.metodoDonacion.update({
            where: { id },
            data: { estado: 'INACTIVO' }
        });
    }

    // Categorias Artista
    async listarCategoriasArtista(): Promise<CategoriaArtista[]> {
        return this.prisma.categoriaArtista.findMany({
            where: { estado: 'ACTIVO' },
            orderBy: { nombre: 'asc' }
        });
    }

    async crearCategoriaArtista(data: { nombre: string }): Promise<CategoriaArtista> {
        return this.prisma.categoriaArtista.create({ data });
    }

    async actualizarCategoriaArtista(id: string, data: Partial<CategoriaArtista>): Promise<CategoriaArtista> {
        return this.prisma.categoriaArtista.update({
            where: { id },
            data
        });
    }

    async eliminarCategoriaArtista(id: string): Promise<CategoriaArtista> {
        // Soft delete
        return this.prisma.categoriaArtista.update({
            where: { id },
            data: { estado: 'INACTIVO' }
        });
    }

    // Roles
    async listarRoles(): Promise<Rol[]> {
        return this.prisma.rol.findMany({
            orderBy: { nombre: 'asc' }
        }).then(roles => roles.map(r => ({ id: r.id, nombre: r.nombre })));
    }
}
