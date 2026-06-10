import { Request, Response } from 'express';
import { RepositorioUsuarioPrisma } from '../../infrastructure/repositories/prisma-user-repository';
import { RepositorioAuthPrisma } from '../../infrastructure/repositories/prisma-auth-repository';
import { AuthService } from '../../application/services/auth-service';
import { loginSchema, registerSchema, refreshSchema } from '../../domain/schemas/auth.schema';
import { LoggerService } from '../../infrastructure/services/logger-service';

const logger = new LoggerService('ControladorAutenticacion');
const repositorioUsuario = new RepositorioUsuarioPrisma();
const repositorioAuth = new RepositorioAuthPrisma();
const authService = new AuthService(repositorioUsuario, repositorioAuth);

export class ControladorAutenticacion {
    async iniciarSesion(req: Request, res: Response) {
        try {
            const validation = loginSchema.safeParse(req.body);
            if (!validation.success) {
                const errorMsg = validation.error.issues[0].message;
                return res.status(400).json({ message: errorMsg });
            }

            const { correo, nombre, imagen, zonaHoraria } = validation.data;

            const response = await authService.iniciarSesion(correo, nombre, imagen, zonaHoraria);
            if (!response) {
                return res.status(404).json({ message: 'Usuario no registrado' });
            }

            return res.status(200).json({
                ...response.usuario,
                token: response.token,
                refreshToken: response.refreshToken,
            });
        } catch (error: any) {
            logger.error(`Error en iniciarSesion: ${error.message}`, error.stack);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async registrar(req: Request, res: Response) {
        try {
            const validation = registerSchema.safeParse(req.body);
            if (!validation.success) {
                const errorMsg = validation.error.issues[0].message;
                return res.status(400).json({ message: errorMsg });
            }

            const { correo, nombre, imagen, zonaHoraria } = validation.data;

            const response = await authService.registrar(correo, nombre, imagen, zonaHoraria);

            return res.status(201).json({
                ...response.usuario,
                token: response.token,
                refreshToken: response.refreshToken,
            });
        } catch (error: any) {
            if (error.message === 'El usuario ya está registrado') {
                return res.status(400).json({ message: error.message });
            }
            logger.error(`Error en registrar: ${error.message}`, error.stack);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async refrescarToken(req: Request, res: Response) {
        try {
            const validation = refreshSchema.safeParse(req.body);
            if (!validation.success) {
                const errorMsg = validation.error.issues[0].message;
                return res.status(400).json({ message: errorMsg });
            }

            const { refreshToken } = validation.data;

            const response = await authService.refrescarToken(refreshToken);
            if (!response) {
                return res.status(401).json({ message: 'Token de refresco inválido o expirado' });
            }

            return res.status(200).json(response);
        } catch (error: any) {
            logger.error(`Error en refrescarToken: ${error.message}`, error.stack);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async cerrarSesion(req: Request, res: Response) {
        try {
            const authHeader = req.headers.authorization;
            const { refreshToken } = req.body;

            if (!authHeader?.startsWith('Bearer ')) {
                return res.status(400).json({ message: 'No se proporcionó token de autenticación' });
            }

            const token = authHeader.substring(7);

            await authService.cerrarSesion(token, refreshToken);

            return res.status(200).json({ message: 'Sesión cerrada exitosamente' });
        } catch (error: any) {
            logger.error(`Error en cerrarSesion: ${error.message}`, error.stack);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
