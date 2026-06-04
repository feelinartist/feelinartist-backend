import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrearUsuarioCasoUso } from './crear-usuario';
import { RepositorioUsuario } from '../../domain/repositories/user-repository';

describe('CrearUsuarioCasoUso', () => {
    let casoUso: CrearUsuarioCasoUso;
    let mockRepositorioUsuario: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockRepositorioUsuario = {
            buscarPorCorreo: vi.fn(),
            crear: vi.fn(),
            actualizar: vi.fn(),
        };

        casoUso = new CrearUsuarioCasoUso(mockRepositorioUsuario as unknown as RepositorioUsuario);
    });

    describe('ejecutar - usuario existente', () => {
        it('debe reactivar la cuenta si el estado es DESHABILITADO', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'DESHABILITADO',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue({
                ...usuarioMock,
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });

            const result = await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });
            expect(result.estadoCuenta).toBe('ACTIVO');
        });

        it('debe reactivar la cuenta si el estado es ELIMINACION_PENDIENTE', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ELIMINACION_PENDIENTE',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'google.com/pic',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                estadoCuenta: 'ACTIVO',
                fechaEliminacionProgramada: null,
            });
        });

        it('debe actualizar el nombre si no existia', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ACTIVO',
                nombre: null,
                imagen: 'google.com/pic',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan Carlos',
                imagen: 'google.com/pic',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                nombre: 'Juan Carlos',
            });
        });

        it('debe actualizar la imagen si cambia', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ACTIVO',
                nombre: 'Juan',
                imagen: 'old-pic.jpg',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);
            mockRepositorioUsuario.actualizar.mockResolvedValue(usuarioMock);

            await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'new-pic.jpg',
            } as any);

            expect(mockRepositorioUsuario.actualizar).toHaveBeenCalledWith('123', {
                imagen: 'new-pic.jpg',
            });
        });

        it('debe retornar el usuario existente sin actualizar si no hay cambios', async () => {
            const usuarioMock = {
                id: '123',
                correo: 'test@test.com',
                estadoCuenta: 'ACTIVO',
                nombre: 'Juan',
                imagen: 'pic.jpg',
            };
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(usuarioMock);

            const result = await casoUso.ejecutar({
                correo: 'test@test.com',
                nombre: 'Juan',
                imagen: 'pic.jpg',
            } as any);

            expect(mockRepositorioUsuario.actualizar).not.toHaveBeenCalled();
            expect(result).toBe(usuarioMock);
        });
    });

    describe('ejecutar - usuario nuevo', () => {
        it('debe crear el usuario con el nombreUsuario proporcionado', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'new@test.com',
                nombreUsuario: 'user_defined',
            });

            const result = await casoUso.ejecutar({
                correo: 'new@test.com',
                nombreUsuario: 'user_defined',
            } as any);

            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith({
                correo: 'new@test.com',
                nombreUsuario: 'user_defined',
            });
            expect(result.nombreUsuario).toBe('user_defined');
        });

        it('debe crear usuario sin nombreUsuario cuando no se proporciona', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'new@test.com',
                nombre: 'Juan Sanchez',
            });

            const result = await casoUso.ejecutar({
                correo: 'new@test.com',
                nombre: 'Juan Sanchez',
            } as any);

            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith({
                correo: 'new@test.com',
                nombre: 'Juan Sanchez',
            });
            expect(result).toEqual({
                correo: 'new@test.com',
                nombre: 'Juan Sanchez',
            });
        });

        it('debe crear usuario con solo correo', async () => {
            mockRepositorioUsuario.buscarPorCorreo.mockResolvedValue(null);
            mockRepositorioUsuario.crear.mockResolvedValue({
                correo: 'solo@test.com',
            });

            const result = await casoUso.ejecutar({
                correo: 'solo@test.com',
            } as any);

            expect(mockRepositorioUsuario.crear).toHaveBeenCalledWith({
                correo: 'solo@test.com',
            });
            expect(result).toEqual({
                correo: 'solo@test.com',
            });
        });
    });
});
