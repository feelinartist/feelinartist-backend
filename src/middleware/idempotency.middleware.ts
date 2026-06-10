import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { idempotencySchema } from '../domain/schemas/idempotency.schema';
import { redisService } from '../infrastructure/services/redis-service';
import { LoggerService } from '../infrastructure/services/logger-service';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
    private readonly logger = new LoggerService('IdempotencyMiddleware');

    async use(req: Request, res: Response, next: NextFunction) {
        // En entorno de desarrollo sin Redis o si la ruta es GET/OPTIONS no aplicamos la restricción
        if (req.method === 'GET' || req.method === 'OPTIONS') {
            return next();
        }

        const idempotencyKey = req.headers['idempotency-key'];

        // Solo validamos si la cabecera está presente (como acordado, de momento no es obligatoria para PedidoCancion, pero si viene, la validamos)
        if (!idempotencyKey) {
            return next();
        }

        const validation = idempotencySchema.safeParse({ idempotencyKey });

        if (!validation.success) {
            return res.status(400).json({
                message: validation.error.issues[0]?.message,
                error: 'Bad Request',
                statusCode: 400,
            });
        }

        const key = `idempotency:${validation.data.idempotencyKey}`;
        const client = redisService.getClient();

        if (client && redisService.getIsConnected()) {
            try {
                // SETNX (set if not exists) con expiración de 24 horas
                // 'NX' asegura que solo se guarde si no existía antes.
                const wasSet = await client.set(key, 'PROCESSING', 'EX', 86400, 'NX');

                if (!wasSet) {
                    this.logger.warn(`Intento de operación duplicada detectado: ${idempotencyKey}`);
                    return res.status(409).json({
                        message: 'Esta solicitud ya está siendo procesada o fue procesada recientemente. (Idempotency error)',
                        error: 'Conflict',
                        statusCode: 409,
                    });
                }
            } catch (err: any) {
                this.logger.error(`Error al verificar Redis en IdempotencyMiddleware: ${err.message}`);
                // En caso de fallo en Redis, decidimos dejar pasar para no bloquear la aplicación,
                // asumiendo el riesgo, o podemos retornar un 500. Optamos por dejar pasar en caso de fallo temporal.
            }
        }

        next();
    }
}
