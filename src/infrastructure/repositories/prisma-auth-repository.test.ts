import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RepositorioAuthPrisma } from './prisma-auth-repository';
import prisma from '../database/prisma';

// prisma is already mocked in vitest.setup.ts
describe('RepositorioAuthPrisma', () => {
    let repository: RepositorioAuthPrisma;

    beforeEach(() => {
        vi.clearAllMocks();
        repository = new RepositorioAuthPrisma();
    });

    it('debería crear un refresh token y mapearlo a entidad', async () => {
        const mockPrismaToken = {
            id: 'token-123',
            token: 'random-bytes',
            usuarioId: 'user-123',
            expiraEn: new Date(),
            creadoEn: new Date(),
            revocado: false,
            usuario: {
                id: 'user-123',
                correo: 'test@example.com',
                nombre: 'John Doe',
                rol: { id: 'rol-1', nombre: 'ARTISTA' }
            }
        };

        vi.mocked(prisma.refreshToken.create).mockResolvedValue(mockPrismaToken as any);

        const result = await repository.crearRefreshToken('user-123', 'random-bytes', mockPrismaToken.expiraEn);

        expect(prisma.refreshToken.create).toHaveBeenCalled();
        expect(result.id).toBe('token-123');
        expect(result.usuario?.correo).toBe('test@example.com');
    });

    it('debería buscar un token válido y retornar null si no existe', async () => {
        vi.mocked(prisma.refreshToken.findFirst).mockResolvedValue(null);

        const result = await repository.buscarRefreshTokenValido('invalid-token');

        expect(result).toBeNull();
    });

    it('debería buscar un token válido y mapearlo', async () => {
        const mockPrismaToken = {
            id: 'token-123',
            token: 'valid-token',
            usuarioId: 'user-123',
            expiraEn: new Date(),
            creadoEn: new Date(),
            revocado: false,
            usuario: {
                id: 'user-123',
                correo: 'test@example.com',
                rol: null
            }
        };

        vi.mocked(prisma.refreshToken.findFirst).mockResolvedValue(mockPrismaToken as any);

        const result = await repository.buscarRefreshTokenValido('valid-token');

        expect(result).not.toBeNull();
        expect(result?.token).toBe('valid-token');
    });

    it('debería buscar un token válido y mapearlo sin usuario si no tiene la relación cargada', async () => {
        const mockPrismaToken = {
            id: 'token-123',
            token: 'valid-token',
            usuarioId: 'user-123',
            expiraEn: new Date(),
            creadoEn: new Date(),
            revocado: false,
            usuario: null
        };

        vi.mocked(prisma.refreshToken.findFirst).mockResolvedValue(mockPrismaToken as any);

        const result = await repository.buscarRefreshTokenValido('valid-token');

        expect(result).not.toBeNull();
        expect(result?.usuario).toBeUndefined();
    });

    it('debería revocar un token por su ID', async () => {
        vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as any);

        await repository.revocarRefreshToken('token-123');

        expect(prisma.refreshToken.update).toHaveBeenCalledWith({
            where: { id: 'token-123' },
            data: { revocado: true }
        });
    });

    it('debería revocar tokens por su token string', async () => {
        vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 1 } as any);

        await repository.revocarRefreshTokenPorToken('token-string');

        expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: { token: 'token-string' },
            data: { revocado: true }
        });
    });
});
