import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock target service
vi.mock('../../infrastructure/services/config-service', () => {
    return {
        configService: {
            get: (...args: any[]) => (globalThis as any).mockConfigServiceGet(...args),
            getMany: (...args: any[]) => (globalThis as any).mockConfigServiceGetMany(...args)
        }
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockConfigServiceGet = vi.fn();
(globalThis as any).mockConfigServiceGetMany = vi.fn();

import { ControladorConfigPublica } from './controlador-config-publica';

describe('ControladorConfigPublica', () => {
    let controller: ControladorConfigPublica;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorConfigPublica();

        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            body: {},
            params: {},
            query: {},
            headers: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('obtenerCredencialesAuth', () => {
        it('should return 403 if authorizedApiKey is not configured in database', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue(null);
            req.headers = { 'x-internal-api-key': 'some-key' };
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await controller.obtenerCredencialesAuth(req as Request, res as Response);

            expect((globalThis as any).mockConfigServiceGet).toHaveBeenCalledWith('INTERNAL_API_KEY');
            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Acceso denegado' });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should return 403 if requestApiKey does not match authorizedApiKey', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('super-secret-key');
            req.headers = { 'x-internal-api-key': 'wrong-key' };
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await controller.obtenerCredencialesAuth(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Acceso denegado' });
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('should log warn indicating key received is null when header is missing and return 403', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('super-secret-key');
            req.headers = {};
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await controller.obtenerCredencialesAuth(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Key recibida: null'));
            warnSpy.mockRestore();
        });

        it('should return configurations and 200 status when requestApiKey matches authorizedApiKey', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('super-secret-key');
            req.headers = { 'x-internal-api-key': 'super-secret-key' };
            
            const mockConfigs = {
                GOOGLE_CLIENT_ID: 'google-id',
                GOOGLE_CLIENT_SECRET: 'google-secret'
            };
            (globalThis as any).mockConfigServiceGetMany.mockResolvedValue(mockConfigs);

            await controller.obtenerCredencialesAuth(req as Request, res as Response);

            expect((globalThis as any).mockConfigServiceGetMany).toHaveBeenCalledWith([
                'GOOGLE_CLIENT_ID',
                'GOOGLE_CLIENT_SECRET'
            ]);
            expect(jsonMock).toHaveBeenCalledWith(mockConfigs);
        });

        it('should return 500 status on internal error', async () => {
            (globalThis as any).mockConfigServiceGet.mockRejectedValue(new Error('Database disconnected'));
            req.headers = { 'x-internal-api-key': 'key' };
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.obtenerCredencialesAuth(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno' });
            expect(errorSpy).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });

    describe('obtenerCategoriasArtista', () => {
        it('should return parsed JSON array', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('["DJ", "Cantante"]');
            await controller.obtenerCategoriasArtista(req as Request, res as Response);
            expect(jsonMock).toHaveBeenCalledWith(['DJ', 'Cantante']);
        });

        it('should fallback to comma separated array if JSON parsing fails', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('DJ, Cantante, Pintor');
            await controller.obtenerCategoriasArtista(req as Request, res as Response);
            expect(jsonMock).toHaveBeenCalledWith(['DJ', 'Cantante', 'Pintor']);
        });

        it('should return empty array if not configured', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue(null);
            await controller.obtenerCategoriasArtista(req as Request, res as Response);
            expect(jsonMock).toHaveBeenCalledWith([]);
        });

        it('should return 500 on internal error', async () => {
            (globalThis as any).mockConfigServiceGet.mockRejectedValue(new Error('DB Error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            await controller.obtenerCategoriasArtista(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ error: 'Error interno' });
            errorSpy.mockRestore();
        });
    });

    describe('obtenerRedesSociales', () => {
        it('should return parsed JSON array', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('["Facebook", "Instagram"]');
            await controller.obtenerRedesSociales(req as Request, res as Response);
            expect(jsonMock).toHaveBeenCalledWith(['Facebook', 'Instagram']);
        });

        it('should return 500 on internal error', async () => {
            (globalThis as any).mockConfigServiceGet.mockRejectedValue(new Error('DB Error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            await controller.obtenerRedesSociales(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
            errorSpy.mockRestore();
        });
    });

    describe('obtenerMetodosDonacion', () => {
        it('should return parsed JSON array', async () => {
            (globalThis as any).mockConfigServiceGet.mockResolvedValue('["Paypal", "Yape"]');
            await controller.obtenerMetodosDonacion(req as Request, res as Response);
            expect(jsonMock).toHaveBeenCalledWith(['Paypal', 'Yape']);
        });

        it('should return 500 on internal error', async () => {
            (globalThis as any).mockConfigServiceGet.mockRejectedValue(new Error('DB Error'));
            const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            await controller.obtenerMetodosDonacion(req as Request, res as Response);
            expect(statusMock).toHaveBeenCalledWith(500);
            errorSpy.mockRestore();
        });
    });
});
