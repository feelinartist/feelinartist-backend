import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../infrastructure/services/logger-service';
import { PrismaService } from '../shared/prisma/prisma.service';

// Extender la interfaz de Express Request para soportar auditInfo
declare global {
    namespace Express {
        interface Request {
            auditInfo?: {
                device: string;
                location: string;
                ip: string;
                userAgent: string;
            };
        }
    }
}

/* v8 ignore start */
@Injectable()
/* v8 ignore stop */
export class AuditMiddleware implements NestMiddleware {
    private readonly logger = new LoggerService('AuditMiddleware');

    constructor(private readonly prisma: PrismaService) {}

    use(req: Request, res: Response, next: NextFunction) {
        const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // Cabeceras personalizadas para auditoría financiera futura
        const clientDevice = (req.headers['x-client-device'] as string) || `Browser/App (UA: ${userAgent})`;
        const clientLocation = (req.headers['x-client-location'] as string) || 'unknown';

        req.auditInfo = {
            device: clientDevice,
            location: clientLocation,
            ip,
            userAgent
        };

        // Loguear operaciones sensibles (POST, PUT, PATCH, DELETE) para trazabilidad de seguridad
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            const auditAction = `HTTP_${req.method}_REQUEST`;
            
            // Guardado asíncrono "Fire and Forget" en BD para no retrasar la respuesta
            this.prisma.client.auditLog.create({
                data: {
                    accion: auditAction,
                    ip,
                    dispositivo: clientDevice,
                    ubicacion: clientLocation,
                    userAgent,
                    metadatos: {
                        url: req.originalUrl,
                        bodySize: req.headers['content-length'] || 0
                    }
                }
            }).catch((err: any) => {
                this.logger.error(`Error al guardar AuditLog en BD: ${err.message}`, err.stack);
            });

            this.logger.log(
                `Operación auditada [${req.method}] ${req.originalUrl} - IP: ${ip} | Dispositivo: ${clientDevice}`
            );
        }

        next();
    }
}
