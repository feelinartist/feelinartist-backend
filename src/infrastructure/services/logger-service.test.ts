import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('winston', async (importOriginal) => {
    const original = await importOriginal<any>();
    Object.defineProperty(original.format, 'colorize', {
        value: vi.fn(() => ({
            transform: (info: any) => info
        })),
        writable: true,
        configurable: true
    });
    return original;
});

import { LoggerService, logger } from './logger-service';

describe('LoggerService', () => {
    beforeEach(() => {
        vi.spyOn(logger, 'info').mockImplementation(() => logger);
        vi.spyOn(logger, 'error').mockImplementation(() => logger);
        vi.spyOn(logger, 'warn').mockImplementation(() => logger);
        vi.spyOn(logger, 'debug').mockImplementation(() => logger);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('debería registrar un log de info con el contexto correspondiente', () => {
        const service = new LoggerService('TestContext');
        service.log('mensaje de prueba');

        expect(logger.info).toHaveBeenCalledWith('mensaje de prueba', { context: 'TestContext' });
    });

    it('debería registrar un error con traza y contexto', () => {
        const service = new LoggerService('TestContext');
        service.error('mensaje de error', 'stacktrace');

        expect(logger.error).toHaveBeenCalledWith('mensaje de error', { trace: 'stacktrace', context: 'TestContext' });
    });

    it('debería registrar una advertencia con contexto', () => {
        const service = new LoggerService('TestContext');
        service.warn('mensaje de advertencia');

        expect(logger.warn).toHaveBeenCalledWith('mensaje de advertencia', { context: 'TestContext' });
    });

    it('debería registrar un debug con contexto', () => {
        const service = new LoggerService('TestContext');
        service.debug('mensaje de depuración');

        expect(logger.debug).toHaveBeenCalledWith('mensaje de depuración', { context: 'TestContext' });
    });

    it('debería sobrescribir el contexto si se pasa en el método', () => {
        const service = new LoggerService('TestContext');
        service.log('mensaje', 'OtroContexto');

        expect(logger.info).toHaveBeenCalledWith('mensaje', { context: 'OtroContexto' });
    });
    it('debería ejecutar la lógica de formateo real del logger en desarrollo', () => {
        const format = logger.format;
        expect(format).toBeDefined();

        const info = {
            level: 'info',
            message: 'mensaje de prueba',
            context: 'Test',
            timestamp: '2026-06-10 11:00:00'
        };

        const result = format.transform(info, {});
        expect(result).toBeDefined();
        
        const infoNoContext = {
            level: 'info',
            message: 'mensaje sin contexto',
            timestamp: '2026-06-10 11:00:00'
        };
        const resultNoContext = format.transform(infoNoContext, {});
        expect(resultNoContext).toBeDefined();
    });

    it('debería configurar el logger para producción si NODE_ENV es production', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        const originalLogLevel = process.env.LOG_LEVEL;
        
        try {
            vi.resetModules();
            process.env.NODE_ENV = 'production';
            process.env.LOG_LEVEL = 'info';

            const { logger: prodLogger } = await import('./logger-service');
            expect(prodLogger).toBeDefined();
            expect(prodLogger.level).toBe('info');
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
            process.env.LOG_LEVEL = originalLogLevel;
            vi.resetModules();
        }
    });

    it('debería usar nivel info por defecto en producción si LOG_LEVEL no está configurado', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        const originalLogLevel = process.env.LOG_LEVEL;
        
        try {
            vi.resetModules();
            process.env.NODE_ENV = 'production';
            delete process.env.LOG_LEVEL;

            const { logger: prodLogger } = await import('./logger-service');
            expect(prodLogger).toBeDefined();
            expect(prodLogger.level).toBe('info');
        } finally {
            process.env.NODE_ENV = originalNodeEnv;
            process.env.LOG_LEVEL = originalLogLevel;
            vi.resetModules();
        }
    });
});
