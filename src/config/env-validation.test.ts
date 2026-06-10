import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateEnv } from './env-validation';

describe('validateEnv', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        vi.stubGlobal('console', {
            error: vi.fn(),
            log: vi.fn(),
        });
        vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    });

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
    });

    it('debería retornar el config parseado si todas las variables requeridas son válidas', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.JWT_SECRET = 'super_secret_jwt_key_change_me_longer_than_16_chars';
        process.env.PORT = '3001';
        process.env.FRONTEND_URL = 'http://localhost:3000';

        const config = validateEnv();

        expect(config.DATABASE_URL).toBe('postgresql://localhost:5432/db');
        expect(config.JWT_SECRET).toBe('super_secret_jwt_key_change_me_longer_than_16_chars');
        expect(config.PORT).toBe('3001');
        expect(config.FRONTEND_URL).toBe('http://localhost:3000');
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('debería fallar e invocar process.exit(1) si falta DATABASE_URL', () => {
        delete process.env.DATABASE_URL;
        process.env.JWT_SECRET = 'super_secret_jwt_key_change_me_longer_than_16_chars';

        validateEnv();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalled();
    });

    it('debería fallar e invocar process.exit(1) si JWT_SECRET tiene menos de 16 caracteres', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.JWT_SECRET = 'corto';

        validateEnv();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalled();
    });

    it('debería fallar e invocar process.exit(1) si FRONTEND_URL no es una URL válida', () => {
        process.env.DATABASE_URL = 'postgresql://localhost:5432/db';
        process.env.JWT_SECRET = 'super_secret_jwt_key_change_me_longer_than_16_chars';
        process.env.FRONTEND_URL = 'not-a-url';

        validateEnv();

        expect(process.exit).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalled();
    });
});
