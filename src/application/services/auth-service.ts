import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { RepositorioAuth } from '../../domain/repositories/auth-repository';
import { generateToken, generateRefreshToken } from '../../middleware/auth';
import { redisService } from '../../infrastructure/services/redis-service';
import jwt from 'jsonwebtoken';
import { Usuario } from '../../domain/entities/user';
import { OAuth2Client } from 'google-auth-library';
import { configService } from '../../infrastructure/services/config-service';

export interface AuthResponse {
    usuario: Usuario;
    token: string;
    refreshToken: string;
}

export interface RefreshResponse {
    token: string;
    refreshToken: string;
}

export class AuthService {
    constructor(
        private readonly repositorioUsuario: RepositorioUsuario,
        private readonly repositorioAuth: RepositorioAuth
    ) {}

    private async crearYGuardarRefreshToken(usuarioId: string): Promise<string> {
        const tokenStr = generateRefreshToken();
        const expiraEn = new Date();
        expiraEn.setDate(expiraEn.getDate() + 7); // 7 días de validez
        await this.repositorioAuth.crearRefreshToken(usuarioId, tokenStr, expiraEn);
        return tokenStr;
    }

    private async verificarGoogleToken(idToken: string) {
        let clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            try {
                clientId = await configService.get('GOOGLE_CLIENT_ID');
            } catch (err) {
                throw new Error("El GOOGLE_CLIENT_ID no está configurado en las variables de entorno ni en la base de datos.");
            }
        }
        
        const client = new OAuth2Client(clientId);
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: clientId,
            });
            const payload = ticket.getPayload();
            
            if (!payload?.email) {
                throw new Error('Token de Google inválido o sin correo');
            }
            
            return {
                correo: payload.email,
                nombre: payload.name || '',
                imagen: payload.picture || ''
            };
        } catch (error: any) {
            throw new Error(`Token de Google inválido o expirado: ${error?.message || 'Error desconocido'}`);
        }
    }

    async iniciarSesion(idToken: string): Promise<AuthResponse | null> {
        const { correo, nombre, imagen } = await this.verificarGoogleToken(idToken);

        const usuarioExistente = await this.repositorioUsuario.buscarPorCorreo(correo);
        if (!usuarioExistente) {
            return null;
        }

        // Simular lógica de reactivación/creación idéntica a CrearUsuarioCasoUso
        const updates: Record<string, any> = {};
        if (usuarioExistente.estado === 'DESHABILITADO' || usuarioExistente.estado === 'ELIMINACION_PENDIENTE') {
            updates.estado = 'ACTIVO';
            updates.fechaEliminacionProgramada = null;
        }
        if (!usuarioExistente.nombre && nombre) updates.nombre = nombre;
        if (imagen && usuarioExistente.imagen !== imagen) updates.imagen = imagen;

        let usuario = usuarioExistente;
        if (Object.keys(updates).length > 0) {
            usuario = await this.repositorioUsuario.actualizar(usuarioExistente.id, updates);
        }

        const token = generateToken({
            id: usuario.id,
            email: usuario.correo,
            rol: usuario.rol?.nombre
        });

        const refreshToken = await this.crearYGuardarRefreshToken(usuario.id);

        return { usuario, token, refreshToken };
    }

    async registrar(idToken: string, zonaHoraria: string): Promise<AuthResponse> {
        const { correo, nombre, imagen } = await this.verificarGoogleToken(idToken);

        const usuarioExistente = await this.repositorioUsuario.buscarPorCorreo(correo);
        if (usuarioExistente) {
            throw new Error('El usuario ya está registrado');
        }

        const usuario = await this.repositorioUsuario.crear({ correo, nombre, imagen, zonaHoraria });

        const token = generateToken({
            id: usuario.id,
            email: usuario.correo,
            rol: usuario.rol?.nombre
        });

        const refreshToken = await this.crearYGuardarRefreshToken(usuario.id);

        return { usuario, token, refreshToken };
    }

    async refrescarToken(refreshToken: string): Promise<RefreshResponse | null> {
        const tokenValido = await this.repositorioAuth.buscarRefreshTokenValido(refreshToken);
        if (!tokenValido?.usuario) {
            return null;
        }

        // Rotación: revocar el token antiguo
        await this.repositorioAuth.revocarRefreshToken(tokenValido.id);

        // Generar nuevos tokens
        const nuevoRefreshToken = await this.crearYGuardarRefreshToken(tokenValido.usuarioId);
        const nuevoAccessToken = generateToken({
            id: tokenValido.usuario.id,
            email: tokenValido.usuario.correo,
            rol: tokenValido.usuario.rol?.nombre
        });

        return { token: nuevoAccessToken, refreshToken: nuevoRefreshToken };
    }

    async cerrarSesion(accessToken: string, refreshToken?: string): Promise<void> {
        // Poner en lista negra el Access Token en Redis
        try {
            const decoded = jwt.decode(accessToken) as { exp?: number };
            if (decoded?.exp) {
                const ahora = Math.floor(Date.now() / 1000);
                const remainingTime = decoded.exp - ahora;
                if (remainingTime > 0) {
                    await redisService.set(`blacklist:token:${accessToken}`, 'true', remainingTime);
                }
            } else {
                await redisService.set(`blacklist:token:${accessToken}`, 'true', 86400);
            }
        } catch {
            await redisService.set(`blacklist:token:${accessToken}`, 'true', 86400);
        }

        // Revocar el Refresh Token en PostgreSQL
        if (refreshToken) {
            await this.repositorioAuth.revocarRefreshTokenPorToken(refreshToken);
        }
    }
}
