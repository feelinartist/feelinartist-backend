import { RepositorioAuth, RefreshToken } from '../../domain/repositories/auth-repository';
import prisma from '../database/prisma';
import { Usuario } from '../../domain/entities/user';

export class RepositorioAuthPrisma implements RepositorioAuth {
    private mapToEntity(prismaToken: any): RefreshToken {
        let usuarioMapped: Usuario | undefined;

        if (prismaToken.usuario) {
            const u = prismaToken.usuario;
            usuarioMapped = {
                id: u.id,
                correo: u.correo,
                nombre: u.nombre,
                imagen: u.imagen,
                nombreUsuario: u.nombreUsuario,
                rol: u.rol ? { id: u.rol.id, nombre: u.rol.nombre } : null,
                zonaHoraria: u.zonaHoraria,
                codigoTelefono: u.codigoTelefono,
                numeroTelefono: u.numeroTelefono,
                ciudad: u.ciudad,
                pais: u.pais,
                generosFavoritos: u.generosFavoritos ?? [],
                creadoEn: u.creadoEn,
                actualizadoEn: u.actualizadoEn,
                ultimoCambioNombreUsuario: u.ultimoCambioNombreUsuario,
                ultimoCambioNombre: u.ultimoCambioNombre,
                estado: u.estado,
                fechaEliminacionProgramada: u.fechaEliminacionProgramada,
                perfilCompletadoReconocido: u.perfilCompletadoReconocido,
            };
        }

        return {
            id: prismaToken.id,
            token: prismaToken.token,
            usuarioId: prismaToken.usuarioId,
            expiraEn: prismaToken.expiraEn,
            creadoEn: prismaToken.creadoEn,
            revocado: prismaToken.revocado,
            usuario: usuarioMapped,
        };
    }

    async crearRefreshToken(usuarioId: string, token: string, expiraEn: Date): Promise<RefreshToken> {
        const prismaToken = await prisma.refreshToken.create({
            data: {
                token,
                usuarioId,
                expiraEn,
            },
            include: {
                usuario: {
                    include: { rol: true },
                },
            },
        });

        return this.mapToEntity(prismaToken);
    }

    async buscarRefreshTokenValido(token: string): Promise<RefreshToken | null> {
        const prismaToken = await prisma.refreshToken.findFirst({
            where: {
                token,
                revocado: false,
                expiraEn: { gt: new Date() },
            },
            include: {
                usuario: {
                    include: { rol: true },
                },
            },
        });

        if (!prismaToken) {
            return null;
        }

        return this.mapToEntity(prismaToken);
    }

    async revocarRefreshToken(id: string): Promise<void> {
        await prisma.refreshToken.update({
            where: { id },
            data: { revocado: true },
        });
    }

    async revocarRefreshTokenPorToken(token: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { token },
            data: { revocado: true },
        });
    }
}
