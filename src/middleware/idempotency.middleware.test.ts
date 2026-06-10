import { describe, expect, it, vi, beforeEach } from 'vitest';
import { IdempotencyMiddleware } from './idempotency.middleware';
import { Request, Response } from 'express';
import { redisService } from '../infrastructure/services/redis-service';
import { LoggerService } from '../infrastructure/services/logger-service';

vi.mock('../infrastructure/services/redis-service', () => ({
    redisService: {
        getClient: vi.fn(),
        getIsConnected: vi.fn(),
    },
}));

describe('IdempotencyMiddleware', () => {
    let middleware: IdempotencyMiddleware;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: any;

    beforeEach(() => {
        vi.clearAllMocks();
        middleware = new IdempotencyMiddleware();
        req = {
            method: 'POST',
            headers: {},
        };
        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        next = vi.fn();
        vi.spyOn(LoggerService.prototype, 'warn').mockImplementation(() => {});
        vi.spyOn(LoggerService.prototype, 'error').mockImplementation(() => {});
    });

    it('debería ignorar peticiones GET u OPTIONS', async () => {
        req.method = 'GET';
        await middleware.use(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    it('debería ignorar si no hay cabecera Idempotency-Key', async () => {
        await middleware.use(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
    });

    it('debería retornar 400 si el Idempotency-Key no es un UUID válido', async () => {
        req.headers = { 'idempotency-key': 'clave-invalida-123' };
        await middleware.use(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Bad Request' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('debería procesar normalmente y bloquear duplicados si la clave es válida', async () => {
        req.headers = { 'idempotency-key': '123e4567-e89b-12d3-a456-426614174000' };
        const setMock = vi.fn().mockResolvedValue('OK'); // Primera vez, Redis settea
        
        vi.mocked(redisService.getIsConnected).mockReturnValue(true);
        vi.mocked(redisService.getClient).mockReturnValue({
            set: setMock,
        } as any);

        await middleware.use(req as Request, res as Response, next);
        
        expect(setMock).toHaveBeenCalledWith(
            'idempotency:123e4567-e89b-12d3-a456-426614174000',
            'PROCESSING',
            'EX',
            86400,
            'NX'
        );
        expect(next).toHaveBeenCalled();

        // Segunda llamada simulando que ya existe
        setMock.mockResolvedValue(null); // Redis devuelve null si NX falla
        await middleware.use(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(409); // Conflict
    });

    it('debería permitir el paso si Redis falla (degradación graciosa)', async () => {
        req.headers = { 'idempotency-key': '123e4567-e89b-12d3-a456-426614174000' };
        const setMock = vi.fn().mockRejectedValue(new Error('Redis Error'));
        
        vi.mocked(redisService.getIsConnected).mockReturnValue(true);
        vi.mocked(redisService.getClient).mockReturnValue({
            set: setMock,
        } as any);

        await middleware.use(req as Request, res as Response, next);
        
        expect(next).toHaveBeenCalled();
    });

    it('debería permitir el paso directamente si Redis no está conectado', async () => {
        req.headers = { 'idempotency-key': '123e4567-e89b-12d3-a456-426614174000' };
        vi.mocked(redisService.getIsConnected).mockReturnValue(false);
        vi.mocked(redisService.getClient).mockReturnValue(null);

        await middleware.use(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
    });
});
