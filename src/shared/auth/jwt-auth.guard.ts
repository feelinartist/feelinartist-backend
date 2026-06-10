import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

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
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        try {
            const authHeader = request.headers.authorization;

            if (!authHeader?.startsWith('Bearer ')) {
                throw new CompatibleUnauthorizedException('No se proporcionó token de autenticación');
            }

            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, getSecret()) as AuthenticatedUser;
            request.user = decoded;

            const path = request.path || request.url || '';
            const isSelectRoleRoute = path.includes('/usuarios/rol') || path.includes('/usuarios/verificar-nombre-usuario');

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
