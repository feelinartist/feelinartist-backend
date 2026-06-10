import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';
import { redisService } from '../../infrastructure/services/redis-service';
import prisma from '../../infrastructure/database/prisma';

function getSecret(): string {
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET or NEXTAUTH_SECRET not configured');
    }
    return secret;
}

class CompatibleForbiddenException extends HttpException {
    constructor(message: string) {
        super({ message }, HttpStatus.FORBIDDEN);
        this.message = message;
    }
}

class CompatibleUnauthorizedException extends HttpException {
    constructor(message: string) {
        super({ message }, HttpStatus.UNAUTHORIZED);
        this.message = message;
    }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        try {
            const authHeader = request.headers.authorization;

            if (!authHeader?.startsWith('Bearer ')) {
                throw new CompatibleUnauthorizedException('No se proporcionó token de autenticación');
            }

            const token = authHeader.substring(7);

            // 1. Check if token is blacklisted in Redis
            const isBlacklisted = await redisService.get(`blacklist:token:${token}`);
            if (isBlacklisted) {
                throw new CompatibleUnauthorizedException('Token inválido o expirado (sesión cerrada)');
            }

            const decoded = jwt.verify(token, getSecret()) as AuthenticatedUser;
            request.user = decoded;

            // 2. Check cached user account status in Redis (fall back to Postgres if not cached)
            const cacheKey = `user:${decoded.id}:status`;
            let status = await redisService.get(cacheKey);
            if (!status) {
                const userDb = await prisma.usuario.findUnique({ where: { id: decoded.id } });
                status = userDb?.estado || 'ACTIVO';
                await redisService.set(cacheKey, status, 86400); // Cache for 24h
            }

            if (status !== 'ACTIVO') {
                throw new CompatibleUnauthorizedException('Tu cuenta ha sido deshabilitada o baneada');
            }

            const path = request.path || request.url || '';
            const isSelectRoleRoute = path.includes('/usuarios/rol') || path.includes('/usuarios/verificar-nombre-usuario') || path.includes('/auth/logout');

            if (!decoded.rol && !isSelectRoleRoute) {
                throw new CompatibleForbiddenException('Debe completar el perfil seleccionando un rol');
            }

            return true;
        } catch (error) {
            if (error instanceof CompatibleUnauthorizedException || error instanceof CompatibleForbiddenException) {
                throw error;
            }
            throw new CompatibleUnauthorizedException('Token inválido o expirado');
        }
    }
}
