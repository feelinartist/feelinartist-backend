import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth-service';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { RepositorioAuth } from '../../domain/repositories/auth-repository';
import { redisService } from '../../infrastructure/services/redis-service';
import jwt from 'jsonwebtoken';

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepo: Partial<RepositorioUsuario>;
    let mockAuthRepo: Partial<RepositorioAuth>;

    beforeEach(() => {
        process.env.JWT_SECRET = 'super_secret_jwt_key_change_me_longer_than_16_chars';

        mockUserRepo = {
            buscarPorCorreo: vi.fn(),
            crear: vi.fn(),
            actualizar: vi.fn(),
        };

        mockAuthRepo = {
            crearRefreshToken: vi.fn(),
            buscarRefreshTokenValido: vi.fn(),
            revocarRefreshToken: vi.fn(),
            revocarRefreshTokenPorToken: vi.fn(),
        };

        authService = new AuthService(
            mockUserRepo as RepositorioUsuario,
            mockAuthRepo as RepositorioAuth
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('iniciarSesion', () => {
        it('debería retornar null si el usuario no existe', async () => {
            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue(null);

            const result = await authService.iniciarSesion('no-existe@test.com');

            expect(result).toBeNull();
        });

        it('debería reactivar el usuario si está DESHABILITADO y retornar tokens', async () => {
            const mockUser = { id: 'u-1', correo: 'test@test.com', estado: 'DESHABILITADO' };
            const updatedUser = { id: 'u-1', correo: 'test@test.com', estado: 'ACTIVO', rol: { nombre: 'ARTISTA' } };

            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue(mockUser);
            mockUserRepo.actualizar = vi.fn().mockResolvedValue(updatedUser);
            mockAuthRepo.crearRefreshToken = vi.fn().mockResolvedValue({} as any);

            const result = await authService.iniciarSesion('test@test.com', 'Nombre', 'imagen.jpg');

            expect(mockUserRepo.actualizar).toHaveBeenCalledWith('u-1', {
                estado: 'ACTIVO',
                fechaEliminacionProgramada: null,
                nombre: 'Nombre',
                imagen: 'imagen.jpg',
            });
            expect(result).toBeDefined();
            expect(result?.usuario.estado).toBe('ACTIVO');
        });

        it('debería reactivar el usuario si está ELIMINACION_PENDIENTE y retornar tokens', async () => {
            const mockUser = { id: 'u-1', correo: 'test@test.com', estado: 'ELIMINACION_PENDIENTE', nombre: 'Test' };
            const updatedUser = { id: 'u-1', correo: 'test@test.com', estado: 'ACTIVO', nombre: 'Test', rol: { nombre: 'ARTISTA' } };

            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue(mockUser);
            mockUserRepo.actualizar = vi.fn().mockResolvedValue(updatedUser);
            mockAuthRepo.crearRefreshToken = vi.fn().mockResolvedValue({} as any);

            const result = await authService.iniciarSesion('test@test.com');

            expect(mockUserRepo.actualizar).toHaveBeenCalledWith('u-1', {
                estado: 'ACTIVO',
                fechaEliminacionProgramada: null
            });
            expect(result).toBeDefined();
        });

        it('no debería actualizar campos si el usuario está ACTIVO y ya tiene los mismos datos', async () => {
            const mockUser = { id: 'u-1', correo: 'test@test.com', estado: 'ACTIVO', nombre: 'Nombre Existente', imagen: 'img.jpg', rol: null };

            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue(mockUser);
            mockAuthRepo.crearRefreshToken = vi.fn().mockResolvedValue({} as any);

            const result = await authService.iniciarSesion('test@test.com', 'Nombre Existente', 'img.jpg');

            expect(mockUserRepo.actualizar).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('no debería actualizar el nombre si ya está definido aunque se pase otro en iniciarSesion', async () => {
            const mockUser = { id: 'u-1', correo: 'test@test.com', estado: 'ACTIVO', nombre: 'Nombre Existente', rol: null };

            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue(mockUser);
            mockAuthRepo.crearRefreshToken = vi.fn().mockResolvedValue({} as any);

            const result = await authService.iniciarSesion('test@test.com', 'Nombre Diferente');

            expect(mockUserRepo.actualizar).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('registrar', () => {
        it('debería lanzar error si el usuario ya existe', async () => {
            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue({ id: 'u-1' });

            await expect(authService.registrar('test@test.com', 'Nombre', 'img', 'America/Bogota'))
                .rejects.toThrow('El usuario ya está registrado');
        });

        it('debería crear el usuario y generar tokens', async () => {
            const mockCreated = { id: 'u-2', correo: 'test@test.com', rol: null };
            mockUserRepo.buscarPorCorreo = vi.fn().mockResolvedValue(null);
            mockUserRepo.crear = vi.fn().mockResolvedValue(mockCreated);
            mockAuthRepo.crearRefreshToken = vi.fn().mockResolvedValue({} as any);

            const result = await authService.registrar('test@test.com', 'Nombre', 'img', 'America/Bogota');

            expect(mockUserRepo.crear).toHaveBeenCalledWith({
                correo: 'test@test.com',
                nombre: 'Nombre',
                imagen: 'img',
                zonaHoraria: 'America/Bogota',
            });
            expect(result.token).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });
    });

    describe('refrescarToken', () => {
        it('debería retornar null si el token de refresco es inválido o no tiene usuario', async () => {
            mockAuthRepo.buscarRefreshTokenValido = vi.fn().mockResolvedValue(null);

            const result = await authService.refrescarToken('token-invalido');

            expect(result).toBeNull();
        });

        it('debería revocar el token anterior y retornar un nuevo par de tokens', async () => {
            const tokenRecord = {
                id: 't-1',
                usuarioId: 'u-1',
                usuario: { id: 'u-1', correo: 'test@test.com', rol: { nombre: 'ARTISTA' } },
            };
            mockAuthRepo.buscarRefreshTokenValido = vi.fn().mockResolvedValue(tokenRecord);
            mockAuthRepo.revocarRefreshToken = vi.fn().mockResolvedValue(undefined);
            mockAuthRepo.crearRefreshToken = vi.fn().mockResolvedValue({} as any);

            const result = await authService.refrescarToken('token-valido');

            expect(mockAuthRepo.revocarRefreshToken).toHaveBeenCalledWith('t-1');
            expect(result?.token).toBeDefined();
            expect(result?.refreshToken).toBeDefined();
        });
    });

    describe('cerrarSesion', () => {
        it('debería registrar el token en la lista negra y revocar el token de refresco si se proporciona', async () => {
            const spyDecode = vi.spyOn(jwt, 'decode').mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 100 } as any);
            const spySet = vi.spyOn(redisService, 'set').mockResolvedValue(undefined);
            mockAuthRepo.revocarRefreshTokenPorToken = vi.fn().mockResolvedValue(undefined);

            await authService.cerrarSesion('access-token', 'refresh-token');

            expect(spySet).toHaveBeenCalledWith('blacklist:token:access-token', 'true', expect.any(Number));
            expect(mockAuthRepo.revocarRefreshTokenPorToken).toHaveBeenCalledWith('refresh-token');
        });

        it('debería usar la expiración por defecto de 24 horas si no tiene exp el token', async () => {
            vi.spyOn(jwt, 'decode').mockReturnValue({ id: 'u-1' } as any);
            const spySet = vi.spyOn(redisService, 'set').mockResolvedValue(undefined);

            await authService.cerrarSesion('access-token');

            expect(spySet).toHaveBeenCalledWith('blacklist:token:access-token', 'true', 86400);
        });

        it('debería usar la expiración por defecto de 24 horas si falla el decode del token', async () => {
            vi.spyOn(jwt, 'decode').mockImplementation(() => { throw new Error('decode error'); });
            const spySet = vi.spyOn(redisService, 'set').mockResolvedValue(undefined);

            await authService.cerrarSesion('access-token');

            expect(spySet).toHaveBeenCalledWith('blacklist:token:access-token', 'true', 86400);
        });

        it('no debería registrar en lista negra si el token ya expiró (remainingTime <= 0)', async () => {
            vi.spyOn(jwt, 'decode').mockReturnValue({ exp: Math.floor(Date.now() / 1000) - 10 } as any);
            const spySet = vi.spyOn(redisService, 'set').mockResolvedValue(undefined);

            await authService.cerrarSesion('access-token');

            expect(spySet).not.toHaveBeenCalled();
        });
    });
});
