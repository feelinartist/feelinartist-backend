import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/encryption-service', () => {
    return {
        EncryptionService: class MockEncryptionService {
            encrypt(text: string) {
                return `encrypted:${text}`;
            }
            decrypt(text: string) {
                if (text.startsWith('encrypted:')) {
                    return text.replace('encrypted:', '');
                }
                throw new Error('Invalid encrypted format');
            }
        }
    };
});

import { PrismaConfigSistemaRepository } from './prisma-config-sistema-repository';
import prisma from '../database/prisma';
import { EncryptionService } from '../services/encryption-service';

// Dynamically inject missing configuracionSistema functions on mocked Prisma client
(prisma.configuracionSistema as any).create = vi.fn();
(prisma.configuracionSistema as any).update = vi.fn();
(prisma.configuracionSistema as any).delete = vi.fn();

describe('PrismaConfigSistemaRepository', () => {
    let repository: PrismaConfigSistemaRepository;
    let encryptSpy: any;
    let decryptSpy: any;

    beforeEach(() => {
        vi.resetAllMocks();
        encryptSpy = vi.spyOn(EncryptionService.prototype, 'encrypt');
        decryptSpy = vi.spyOn(EncryptionService.prototype, 'decrypt');
        repository = new PrismaConfigSistemaRepository();
    });

    describe('obtenerTodas', () => {
        it('should retrieve all configs and decrypt their values (handling both encrypted and plain text values)', async () => {
            const mockConfigs = [
                { id: '1', clave: 'ENCRYPTED_VAL', valor: 'encrypted:hello', descripcion: 'D1' },
                { id: '2', clave: 'PLAIN_VAL', valor: 'http://plain-url.com', descripcion: 'D2' }
            ];

            vi.mocked(prisma.configuracionSistema.findMany).mockResolvedValue(mockConfigs as any);

            const result = await repository.obtenerTodas();

            expect(prisma.configuracionSistema.findMany).toHaveBeenCalledWith({
                orderBy: { clave: 'asc' }
            });
            expect(decryptSpy).toHaveBeenCalledTimes(2);
            expect(result).toEqual([
                { id: '1', clave: 'ENCRYPTED_VAL', valor: 'hello', descripcion: 'D1' },
                { id: '2', clave: 'PLAIN_VAL', valor: 'http://plain-url.com', descripcion: 'D2' }
            ]);
        });
    });

    describe('obtenerPorClave', () => {
        it('should return null if config by key is not found', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(null);

            const result = await repository.obtenerPorClave('MISSING');

            expect(prisma.configuracionSistema.findUnique).toHaveBeenCalledWith({
                where: { clave: 'MISSING' }
            });
            expect(result).toBeNull();
        });

        it('should return decrypted config if found', async () => {
            const mockConfig = { id: '1', clave: 'KEY', valor: 'encrypted:secret' };
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(mockConfig as any);

            const result = await repository.obtenerPorClave('KEY');

            expect(decryptSpy).toHaveBeenCalledWith('encrypted:secret');
            expect(result).toEqual({ id: '1', clave: 'KEY', valor: 'secret' });
        });
    });

    describe('crear', () => {
        it('should encrypt value and create config', async () => {
            const input = { clave: 'NEW_KEY', valor: 'supersecret', descripcion: 'desc', creadoPor: 'user-1' };
            const mockCreated = { id: '9', clave: 'NEW_KEY', valor: 'encrypted:supersecret', descripcion: 'desc', creadoPor: 'user-1' };
            vi.mocked((prisma.configuracionSistema as any).create).mockResolvedValue(mockCreated as any);

            const result = await repository.crear(input);

            expect(encryptSpy).toHaveBeenCalledWith('supersecret');
            expect((prisma.configuracionSistema as any).create).toHaveBeenCalledWith({
                data: {
                    clave: 'NEW_KEY',
                    valor: 'encrypted:supersecret',
                    descripcion: 'desc',
                    creadoPor: 'user-1'
                }
            });
            expect(result).toEqual(mockCreated);
        });
    });

    describe('actualizar', () => {
        it('should encrypt new value and update config', async () => {
            const mockUpdated = { id: '1', clave: 'KEY', valor: 'encrypted:newsecret', actualizadoPor: 'user-2' };
            vi.mocked((prisma.configuracionSistema as any).update).mockResolvedValue(mockUpdated as any);

            const result = await repository.actualizar('1', 'newsecret', 'user-2');

            expect(encryptSpy).toHaveBeenCalledWith('newsecret');
            expect((prisma.configuracionSistema as any).update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    valor: 'encrypted:newsecret',
                    actualizadoPor: 'user-2'
                }
            });
            expect(result).toEqual(mockUpdated);
        });
    });

    describe('eliminar', () => {
        it('should delete config', async () => {
            const mockDeleted = { id: '1', clave: 'KEY', valor: 'val' };
            vi.mocked((prisma.configuracionSistema as any).delete).mockResolvedValue(mockDeleted as any);

            const result = await repository.eliminar('1');

            expect((prisma.configuracionSistema as any).delete).toHaveBeenCalledWith({
                where: { id: '1' }
            });
            expect(result).toEqual(mockDeleted);
        });
    });

    describe('obtenerValor', () => {
        it('should return decrypted value of config if found', async () => {
            const mockConfig = { id: '1', clave: 'KEY', valor: 'encrypted:secret' };
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(mockConfig as any);

            const result = await repository.obtenerValor('KEY');

            expect(result).toBe('secret');
        });

        it('should return null if config by key is not found when calling obtenerValor', async () => {
            vi.mocked(prisma.configuracionSistema.findUnique).mockResolvedValue(null);

            const result = await repository.obtenerValor('KEY');

            expect(result).toBeNull();
        });
    });
});
