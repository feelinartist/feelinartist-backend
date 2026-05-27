import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import prisma from '../database/prisma';
import { EncryptionService } from './encryption-service';
import { configService } from './config-service';

// Mock the prisma import
vi.mock('../database/prisma', () => {
    return {
        default: {
            configuracionSistema: {
                findUnique: vi.fn(),
                update: vi.fn(),
                create: vi.fn(),
            },
        },
    };
});

describe('ConfigService', () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
        configService.clearCache();
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('get', () => {
        it('should return cached value if present and not expired', async () => {
            // Seed the cache manually
            (configService as any).cache.set('TEST_KEY', 'cached_value');
            (configService as any).cache.Expiry = undefined; // Will be ignored by simple cache check if expiry is valid
            (configService as any).cacheExpiry.set('TEST_KEY', Date.now() + 100000);

            const result = await configService.get('TEST_KEY');
            expect(result).toBe('cached_value');
            expect(prisma.configuracionSistema.findUnique).not.toHaveBeenCalled();
        });

        it('should query DB and return value if not cached', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue({
                clave: 'TEST_KEY',
                valor: 'db_value',
                descripcion: 'test'
            } as any);

            const result = await configService.get('TEST_KEY');
            expect(result).toBe('db_value');
            expect(prisma.configuracionSistema.findUnique).toHaveBeenCalledWith({
                where: { clave: 'TEST_KEY' }
            });
            // Should cache it
            expect((configService as any).cache.get('TEST_KEY')).toBe('db_value');
        });

        it('should decrypt value if key is in CLAVES_ENCRIPTADAS', async () => {
            const decryptSpy = vi.spyOn(EncryptionService.prototype, 'decrypt').mockReturnValue('decrypted_secret');
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue({
                clave: 'NEXTAUTH_SECRET',
                valor: 'encrypted_secret_data',
                descripcion: 'secret'
            } as any);

            const result = await configService.get('NEXTAUTH_SECRET');
            expect(result).toBe('decrypted_secret');
            expect(decryptSpy).toHaveBeenCalledWith('encrypted_secret_data');
            decryptSpy.mockRestore();
        });

        it('should use raw value if decryption fails for key in CLAVES_ENCRIPTADAS', async () => {
            const decryptSpy = vi.spyOn(EncryptionService.prototype, 'decrypt').mockImplementation(() => {
                throw new Error('decryption failed');
            });
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue({
                clave: 'NEXTAUTH_SECRET',
                valor: 'encrypted_secret_data',
                descripcion: 'secret'
            } as any);

            const result = await configService.get('NEXTAUTH_SECRET');
            expect(result).toBe('encrypted_secret_data');
            expect(consoleErrorSpy).toHaveBeenCalled();
            decryptSpy.mockRestore();
        });

        it('should decrypt value if it has retro-compat pattern (contains : and not http)', async () => {
            const decryptSpy = vi.spyOn(EncryptionService.prototype, 'decrypt').mockReturnValue('decrypted_retro');
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue({
                clave: 'RETRO_KEY',
                valor: 'some:encrypted:data',
                descripcion: 'retro'
            } as any);

            const result = await configService.get('RETRO_KEY');
            expect(result).toBe('decrypted_retro');
            expect(decryptSpy).toHaveBeenCalledWith('some:encrypted:data');
            decryptSpy.mockRestore();
        });

        it('should ignore decryption error for retro-compat pattern and return original value', async () => {
            const decryptSpy = vi.spyOn(EncryptionService.prototype, 'decrypt').mockImplementation(() => {
                throw new Error('decryption failed');
            });
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue({
                clave: 'RETRO_KEY',
                valor: 'some:plain:text',
                descripcion: 'retro'
            } as any);

            const result = await configService.get('RETRO_KEY');
            expect(result).toBe('some:plain:text');
            decryptSpy.mockRestore();
        });

        it('should throw error if config not found in DB and no defaultValue provided', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(null);

            await expect(configService.get('NON_EXISTENT')).rejects.toThrow(
                "Configuración 'NON_EXISTENT' no encontrada"
            );
        });

        it('should return defaultValue if config not found in DB and defaultValue is provided', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(null);

            const result = await configService.get('NON_EXISTENT', 'default_val');
            expect(result).toBe('default_val');
        });

        it('should log and throw error if DB query fails and no defaultValue provided', async () => {
            const dbError = new Error('DB connection failed');
            vi.mocked(prisma.configuracionSistema.findUnique).mockRejectedValue(dbError);

            await expect(configService.get('DB_ERROR_KEY')).rejects.toThrow(dbError);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should log and return defaultValue if DB query fails and defaultValue is provided', async () => {
            const dbError = new Error('DB connection failed');
            vi.mocked(prisma.configuracionSistema.findUnique).mockRejectedValue(dbError);

            const result = await configService.get('DB_ERROR_KEY', 'fallback_val');
            expect(result).toBe('fallback_val');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('getMany', () => {
        it('should fetch multiple keys and return record', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique)
                .mockResolvedValueOnce({ clave: 'KEY1', valor: 'val1' } as any)
                .mockRejectedValueOnce(new Error('Key 2 fails'))
                .mockResolvedValueOnce({ clave: 'KEY3', valor: 'val3' } as any);

            const result = await configService.getMany(['KEY1', 'KEY2', 'KEY3']);
            expect(result).toEqual({
                KEY1: 'val1',
                KEY3: 'val3'
            });
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('clearCacheKey', () => {
        it('should delete specified key from cache and cacheExpiry', () => {
            (configService as any).cache.set('KEY1', 'val1');
            (configService as any).cacheExpiry.set('KEY1', 12345);

            configService.clearCacheKey('KEY1');

            expect((configService as any).cache.has('KEY1')).toBe(false);
            expect((configService as any).cacheExpiry.has('KEY1')).toBe(false);
        });
    });

    describe('set', () => {
        it('should update key if it already exists', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue({
                clave: 'EXISTING_KEY',
                valor: 'old_val'
            } as any);

            const encryptSpy = vi.spyOn(EncryptionService.prototype, 'encrypt').mockReturnValue('encrypted_new_val');

            await configService.set('EXISTING_KEY', 'new_val', 'desc', true);

            expect(encryptSpy).toHaveBeenCalledWith('new_val');
            expect(prisma.configuracionSistema.update).toHaveBeenCalledWith({
                where: { clave: 'EXISTING_KEY' },
                data: { valor: 'encrypted_new_val' }
            });
            expect(prisma.configuracionSistema.create).not.toHaveBeenCalled();

            encryptSpy.mockRestore();
        });

        it('should create key if it does not exist', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(null);

            await configService.set('NEW_KEY', 'new_val', 'desc', false);

            expect(prisma.configuracionSistema.create).toHaveBeenCalledWith({
                data: {
                    clave: 'NEW_KEY',
                    valor: 'new_val',
                    descripcion: 'desc'
                }
            });
            expect(prisma.configuracionSistema.update).not.toHaveBeenCalled();
        });
    });
});
