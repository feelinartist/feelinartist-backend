import { RedSocial, MetodoDonacion, CategoriaArtista } from '@prisma/client';
import { RepositorioConfig } from '../../domain/repositories/config-repository';
import { Rol } from '../../domain/entities/user';
import prisma from '../database/prisma';
import { redisService } from '../services/redis-service';

export class RepositorioConfigPrisma implements RepositorioConfig {
    private readonly prisma = prisma;

    // Redes Sociales
    async listarRedesSociales(): Promise<RedSocial[]> {
        const cacheKey = 'config:redes_sociales';
        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.error('Error reading redes sociales cache:', err);
        }

        const result = await this.prisma.redSocial.findMany({
            where: { estado: 'ACTIVO' },
            orderBy: { nombre: 'asc' }
        });

        try {
            await redisService.set(cacheKey, JSON.stringify(result), 3600);
        } catch (err) {
            console.error('Error writing redes sociales cache:', err);
        }
        return result;
    }

    async crearRedSocial(data: { nombre: string; urlBase: string; icono?: string }): Promise<RedSocial> {
        const red = await this.prisma.redSocial.create({ data });
        try {
            await redisService.del('config:redes_sociales');
        } catch (err) {
            console.error('Error deleting redes sociales cache:', err);
        }
        return red;
    }

    async actualizarRedSocial(id: string, data: Partial<RedSocial>): Promise<RedSocial> {
        const red = await this.prisma.redSocial.update({
            where: { id },
            data
        });
        try {
            await redisService.del('config:redes_sociales');
        } catch (err) {
            console.error('Error deleting redes sociales cache:', err);
        }
        return red;
    }

    async eliminarRedSocial(id: string): Promise<RedSocial> {
        // Soft delete
        const red = await this.prisma.redSocial.update({
            where: { id },
            data: { estado: 'INACTIVO' }
        });
        try {
            await redisService.del('config:redes_sociales');
        } catch (err) {
            console.error('Error deleting redes sociales cache:', err);
        }
        return red;
    }

    // Metodos Donacion
    async listarMetodosDonacion(): Promise<MetodoDonacion[]> {
        const cacheKey = 'config:metodos_donacion';
        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.error('Error reading metodos donacion cache:', err);
        }

        const result = await this.prisma.metodoDonacion.findMany({
            where: { estado: 'ACTIVO' },
            orderBy: { nombre: 'asc' }
        });

        try {
            await redisService.set(cacheKey, JSON.stringify(result), 3600);
        } catch (err) {
            console.error('Error writing metodos donacion cache:', err);
        }
        return result;
    }

    async crearMetodoDonacion(data: { nombre: string; icono?: string }): Promise<MetodoDonacion> {
        const metodo = await this.prisma.metodoDonacion.create({ data });
        try {
            await redisService.del('config:metodos_donacion');
        } catch (err) {
            console.error('Error deleting metodos donacion cache:', err);
        }
        return metodo;
    }

    async actualizarMetodoDonacion(id: string, data: Partial<MetodoDonacion>): Promise<MetodoDonacion> {
        const metodo = await this.prisma.metodoDonacion.update({
            where: { id },
            data
        });
        try {
            await redisService.del('config:metodos_donacion');
        } catch (err) {
            console.error('Error deleting metodos donacion cache:', err);
        }
        return metodo;
    }

    async eliminarMetodoDonacion(id: string): Promise<MetodoDonacion> {
        // Soft delete
        const metodo = await this.prisma.metodoDonacion.update({
            where: { id },
            data: { estado: 'INACTIVO' }
        });
        try {
            await redisService.del('config:metodos_donacion');
        } catch (err) {
            console.error('Error deleting metodos donacion cache:', err);
        }
        return metodo;
    }

    // Categorias Artista
    async listarCategoriasArtista(): Promise<CategoriaArtista[]> {
        const cacheKey = 'config:categorias_artista';
        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            console.error('Error reading categorias artista cache:', err);
        }

        const result = await this.prisma.categoriaArtista.findMany({
            where: { estado: 'ACTIVO' },
            orderBy: { nombre: 'asc' }
        });

        try {
            await redisService.set(cacheKey, JSON.stringify(result), 3600);
        } catch (err) {
            console.error('Error writing categorias artista cache:', err);
        }
        return result;
    }

    async crearCategoriaArtista(data: { nombre: string }): Promise<CategoriaArtista> {
        const cat = await this.prisma.categoriaArtista.create({ data });
        try {
            await redisService.del('config:categorias_artista');
        } catch (err) {
            console.error('Error deleting categorias artista cache:', err);
        }
        return cat;
    }

    async actualizarCategoriaArtista(id: string, data: Partial<CategoriaArtista>): Promise<CategoriaArtista> {
        const cat = await this.prisma.categoriaArtista.update({
            where: { id },
            data
        });
        try {
            await redisService.del('config:categorias_artista');
        } catch (err) {
            console.error('Error deleting categorias artista cache:', err);
        }
        return cat;
    }

    async eliminarCategoriaArtista(id: string): Promise<CategoriaArtista> {
        // Soft delete
        const cat = await this.prisma.categoriaArtista.update({
            where: { id },
            data: { estado: 'INACTIVO' }
        });
        try {
            await redisService.del('config:categorias_artista');
        } catch (err) {
            console.error('Error deleting categorias artista cache:', err);
        }
        return cat;
    }

    // Roles
    async listarRoles(): Promise<Rol[]> {
        return this.prisma.rol.findMany({
            orderBy: { nombre: 'asc' }
        }).then(roles => roles.map(r => ({ id: r.id, nombre: r.nombre })));
    }
}
