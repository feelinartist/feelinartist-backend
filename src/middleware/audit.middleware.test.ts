import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuditMiddleware } from './audit.middleware';
import { Request, Response } from 'express';
import { LoggerService } from '../infrastructure/services/logger-service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma/prisma.service';

describe('AuditMiddleware', () => {
    let middleware: AuditMiddleware;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: any;
    let loggerSpy: any;

    let prismaMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        prismaMock = {
            client: {
                auditLog: {
                    create: vi.fn().mockResolvedValue({}),
                },
            },
        };
        middleware = new AuditMiddleware(prismaMock as any);
        req = {
            method: 'POST',
            originalUrl: '/auth/login',
            headers: {},
            ip: '127.0.0.1',
        };
        res = {};
        next = vi.fn();
        loggerSpy = vi.spyOn(LoggerService.prototype, 'log').mockImplementation(() => {});
    });

    it('debería adjuntar la información de auditoría a la request con valores por defecto', () => {
        middleware.use(req as Request, res as Response, next);

        expect(req.auditInfo).toBeDefined();
        expect(req.auditInfo?.ip).toBe('127.0.0.1');
        expect(req.auditInfo?.location).toBe('unknown');
        expect(req.auditInfo?.device).toContain('Browser/App');
        expect(loggerSpy).toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('debería usar las cabeceras X-Client-Device y X-Client-Location si se proporcionan', () => {
        req.headers = {
            'x-client-device': 'iPhone 15 Pro',
            'x-client-location': 'lat: -12.04637, lon: -77.04279',
        };

        middleware.use(req as Request, res as Response, next);

        expect(req.auditInfo?.device).toBe('iPhone 15 Pro');
        expect(req.auditInfo?.location).toBe('lat: -12.04637, lon: -77.04279');
    });

    it('no debería escribir un log si el método HTTP es GET', () => {
        req.method = 'GET';
        middleware.use(req as Request, res as Response, next);

        expect(loggerSpy).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('debería loguear un error si la creación del auditLog falla', async () => {
        const errorSpy = vi.spyOn(LoggerService.prototype, 'error').mockImplementation(() => {});
        const dbError = new Error('Database connection failed');
        prismaMock.client.auditLog.create.mockRejectedValueOnce(dbError);

        middleware.use(req as Request, res as Response, next);

        // Esperar a que la microtarea asíncrona termine
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error al guardar AuditLog en BD: Database connection failed'),
            dbError.stack
        );
        errorSpy.mockRestore();
    });

    it('debería usar x-forwarded-for header para ip si está presente', () => {
        req.headers = { 'x-forwarded-for': '203.0.113.195' };
        middleware.use(req as Request, res as Response, next);
        expect(req.auditInfo?.ip).toBe('203.0.113.195');
    });

    it('debería usar fallback para ip y userAgent si no están presentes', () => {
        delete req.ip;
        req.headers = {}; // No x-forwarded-for, no user-agent
        middleware.use(req as Request, res as Response, next);
        expect(req.auditInfo?.ip).toBe('unknown');
        expect(req.auditInfo?.userAgent).toBe('unknown');
    });

    it('debería incluir content-length en los metadatos si está presente', () => {
        req.headers = { 'content-length': '123' };
        middleware.use(req as Request, res as Response, next);
        
        expect(prismaMock.client.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                metadatos: expect.objectContaining({
                    bodySize: '123'
                })
            })
        }));
    });

    it('debería usar la cabecera user-agent si se proporciona', () => {
        req.headers = { 'user-agent': 'Mozilla/5.0' };
        middleware.use(req as Request, res as Response, next);
        expect(req.auditInfo?.userAgent).toBe('Mozilla/5.0');
    });

    it('debería instanciarse correctamente usando NestJS Dependency Injection', async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                AuditMiddleware,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        const instance = moduleRef.get<AuditMiddleware>(AuditMiddleware);
        expect(instance).toBeDefined();
    });
});
