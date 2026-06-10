import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define dynamic mock implementation using globalThis to bypass vi.mock hoisting
(globalThis as any).mockDeleteImageImpl = vi.fn().mockResolvedValue(true);

vi.mock('../services/local-file-service', () => {
    return {
        LocalFileService: class MockLocalFileService {
            async deleteImage(...args: any[]) {
                return (globalThis as any).mockDeleteImageImpl(...args);
            }
        }
    };
});

import { RepositorioUsuarioPrisma } from './prisma-user-repository';
import prisma from '../database/prisma';
import { redisService } from '../services/redis-service';

vi.mock('../services/redis-service', () => {
    return {
        redisService: {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
        }
    };
});

describe('RepositorioUsuarioPrisma', () => {
    let repository: RepositorioUsuarioPrisma;

    beforeEach(() => {
        vi.resetAllMocks();
        (globalThis as any).mockDeleteImageImpl.mockReset();
        (globalThis as any).mockDeleteImageImpl.mockResolvedValue(true);
        vi.mocked(redisService.del).mockResolvedValue(1 as any);
        
        // Explicitly reset mocks that have queued results to avoid leakages
        vi.mocked(prisma.perfilArtista.findUnique).mockReset();
        vi.mocked(prisma.galeriaArtista.findMany).mockReset();
        
        repository = new RepositorioUsuarioPrisma();
    });

    describe('crear', () => {
        it('crear: should create user and update creadoPor audit field when rol is provided', async () => {
            const mockUser = {
                id: 'user-1',
                correo: 'user@test.com',
                nombre: 'User Test',
                nombreUsuario: 'usertest',
                rol: { id: 'rol-1', nombre: 'ARTISTA' },
                creadoEn: new Date(),
                actualizadoEn: new Date(),
            };

            vi.mocked(prisma.usuario.create).mockResolvedValue(mockUser as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue({} as any);

            const result = await repository.crear({
                correo: 'user@test.com',
                nombre: 'User Test',
                nombreUsuario: 'usertest',
                rol: 'ARTISTA'
            });

            expect(prisma.usuario.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        correo: 'user@test.com',
                        nombre: 'User Test',
                        rol: { connect: { nombre: 'ARTISTA' } }
                    })
                })
            );
            expect(prisma.usuario.update).toHaveBeenCalledWith({
                where: { id: 'user-1' },
                data: { creadoPor: 'user-1', actualizadoPor: 'user-1' }
            });
            expect(result.id).toBe('user-1');
        });

        it('crear: should create user when rol is not provided', async () => {
            const mockUser = {
                id: 'user-2',
                correo: 'user2@test.com',
                nombre: 'User Test 2',
                rol: null
            };
            vi.mocked(prisma.usuario.create).mockResolvedValue(mockUser as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue({} as any);

            await repository.crear({
                correo: 'user2@test.com',
                nombre: 'User Test 2'
            });

            expect(prisma.usuario.create).toHaveBeenCalledWith({
                data: {
                    correo: 'user2@test.com',
                    nombre: 'User Test 2',
                    imagen: undefined,
                    nombreUsuario: undefined,
                    rol: undefined
                },
                include: { rol: true }
            });
        });
    });

    describe('buscarPorCorreo', () => {
        it('buscarPorCorreo: should find user and return mapToEntity', async () => {
            const mockUser = {
                id: 'user-1',
                correo: 'user@test.com',
                nombre: 'User Test',
                rol: null
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const result = await repository.buscarPorCorreo('user@test.com');
            expect(result?.id).toBe('user-1');
            expect(prisma.usuario.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { correo: 'user@test.com' } })
            );
        });

        it('buscarPorCorreo: should return null if user not found', async () => {
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
            const result = await repository.buscarPorCorreo('none@test.com');
            expect(result).toBeNull();
        });

        it('buscarPorCorreo: should log and throw error on database failure', async () => {
            const error = new Error('DB Error');
            vi.mocked(prisma.usuario.findUnique).mockRejectedValue(error);
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(repository.buscarPorCorreo('user@test.com')).rejects.toThrow('DB Error');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('buscarPorId', () => {
        it('buscarPorId: should find user and return mapped entity when no solicitor is provided', async () => {
            const mockUser = {
                id: 'user-1',
                correo: 'u1@test.com',
                rol: null
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const result = await repository.buscarPorId('user-1');
            expect(result?.id).toBe('user-1');
        });

        it('buscarPorId: should find and return user when solicitor is provided but no blocks exist', async () => {
            const mockUser = {
                id: 'user-1',
                correo: 'u1@test.com',
                rol: null,
                bloqueados: [],
                bloqueadoPor: []
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const result = await repository.buscarPorId('user-1', 'solicitor-1');
            expect(result?.id).toBe('user-1');
        });

        it('buscarPorId: should map complete user with all profiles populated', async () => {
            const mockUser = {
                id: 'user-1',
                correo: 'u1@test.com',
                rol: { id: 'rol-1', nombre: 'ARTISTA' },
                perfilArtista: { id: 'pa-1' },
                perfilPublico: { id: 'pp-1' },
                perfilDiscoteca: { id: 'pd-1' }
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const result = await repository.buscarPorId('user-1');
            expect(result?.perfilArtista).toEqual({ id: 'pa-1' });
            expect(result?.perfilPublico).toEqual({ id: 'pp-1' });
            expect(result?.perfilDiscoteca).toEqual({ id: 'pd-1' });
        });

        it('buscarPorId: should find user and filter out if blocked by solicitor', async () => {
            const mockUser = {
                id: 'user-1',
                bloqueados: [{ bloqueadoId: 'solicitor-1' }],
                bloqueadoPor: []
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const resultBlocked = await repository.buscarPorId('user-1', 'solicitor-1');
            expect(resultBlocked).toBeNull();
        });

        it('buscarPorId: should find user and filter out if blocking solicitor', async () => {
            const mockUser = {
                id: 'user-1',
                bloqueados: [],
                bloqueadoPor: [{ bloqueadorId: 'solicitor-1' }]
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const resultBlocked = await repository.buscarPorId('user-1', 'solicitor-1');
            expect(resultBlocked).toBeNull();
        });

        it('buscarPorId: should return null if not found', async () => {
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
            const result = await repository.buscarPorId('unknown');
            expect(result).toBeNull();
        });
    });

    describe('buscarPorNombreUsuario', () => {
        it('buscarPorNombreUsuario: should retrieve cached profile if requested publicly', async () => {
            const mockUser = { id: 'user-1', nombreUsuario: 'testuser' };
            vi.mocked(redisService.get).mockResolvedValue(JSON.stringify(mockUser));

            const result = await repository.buscarPorNombreUsuario('testuser');
            expect(result?.id).toBe('user-1');
            expect(redisService.get).toHaveBeenCalledWith('user:profile:testuser');
            expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
        });

        it('buscarPorNombreUsuario: should query database, cache result and return entity', async () => {
            const mockUser = { id: 'user-1', nombreUsuario: 'testuser' };
            vi.mocked(redisService.get).mockResolvedValue(null);
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const result = await repository.buscarPorNombreUsuario('testuser');
            expect(result?.id).toBe('user-1');
            expect(redisService.set).toHaveBeenCalledWith(
                'user:profile:testuser',
                expect.any(String),
                600
            );
        });

        it('buscarPorNombreUsuario: should return user and NOT cache when solicitor is provided and no blocks exist', async () => {
            const mockUser = {
                id: 'user-1',
                nombreUsuario: 'testuser',
                bloqueados: [],
                bloqueadoPor: []
            };
            vi.mocked(redisService.get).mockResolvedValue(null);
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);

            const result = await repository.buscarPorNombreUsuario('testuser', 'solicitor-1');
            expect(result?.id).toBe('user-1');
            expect(redisService.set).not.toHaveBeenCalled();
        });

        it('buscarPorNombreUsuario: should handle Redis errors gracefully', async () => {
            const mockUser = { id: 'user-1', nombreUsuario: 'testuser' };
            vi.mocked(redisService.get).mockRejectedValue(new Error('Redis Down'));
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUser as any);
            vi.mocked(redisService.set).mockRejectedValue(new Error('Redis Down'));

            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await repository.buscarPorNombreUsuario('testuser');
            expect(result?.id).toBe('user-1');
            expect(warnSpy).toHaveBeenCalledTimes(2);

            warnSpy.mockRestore();
        });

        it('buscarPorNombreUsuario: should return null if solicitor is blocked/blocking', async () => {
            const mockUserBlocked = {
                id: 'user-1',
                nombreUsuario: 'blockeduser',
                bloqueados: [{ bloqueadoId: 'solicitor-1' }],
                bloqueadoPor: []
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBlocked as any);

            const result = await repository.buscarPorNombreUsuario('blockeduser', 'solicitor-1');
            expect(result).toBeNull();
        });

        it('buscarPorNombreUsuario: should return null if solicitor is blocking the user but user has no blocks', async () => {
            const mockUserBlocked = {
                id: 'user-1',
                nombreUsuario: 'blockeduser',
                bloqueados: [],
                bloqueadoPor: [{ bloqueadorId: 'solicitor-1' }]
            };
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBlocked as any);

            const result = await repository.buscarPorNombreUsuario('blockeduser', 'solicitor-1');
            expect(result).toBeNull();
        });

        it('buscarPorNombreUsuario: should return null if user is not found in DB', async () => {
            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);
            const result = await repository.buscarPorNombreUsuario('missinguser');
            expect(result).toBeNull();
        });
    });

    describe('actualizar', () => {
        it('actualizar: should generate update data and invalidate cache (full perfilArtista scenario)', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1', pagoQR: 'https://example.com/upload/v123/pago_qr_old.jpg' } as any);
            vi.mocked(prisma.galeriaArtista.findMany).mockResolvedValue([{ urlImagen: 'https://example.com/uploads/users/123/galeria/img_old.png' }] as any);

            const result = await repository.actualizar('user-1', {
                nombreUsuario: 'testnew',
                rol: 'ARTISTA',
                perfilArtista: {
                    biografia: 'Bio text',
                    pagoQR: 'https://example.com/upload/v123/pago_qr.jpg',
                    musicQR: 'https://example.com/upload/v123/music_qr.jpg',
                    nombreQR: 'name_qr',
                    urlPago: 'https://example.com/pay',
                    redesSociales: [
                        { redSocialId: 'ig', nombreUsuario: 'insta_user' },
                        { redSocialId: 'wa', codigoTelefono: '+51', numeroTelefono: '999999999' }
                    ],
                    metodosDonacion: [
                        { metodoDonacionId: 'yape', numeroTelefono: '999999999' }
                    ],
                    galeria: [
                        'https://example.com/uploads/users/123/galeria/img1.png',
                        { urlImagen: 'https://example.com/uploads/users/123/galeria/img2.png' }
                    ]
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalled();
            expect(redisService.del).toHaveBeenCalledWith('user:profile:testold');
            expect(redisService.del).toHaveBeenCalledWith('user:profile:testnew');
            expect(result.nombreUsuario).toBe('testnew');
        });

        it('actualizar: should map all remaining fields and check all redesSociales phone fallbacks', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            const ultimoCambioNombreUsuario = new Date();
            const ultimoCambioNombre = new Date();

            await repository.actualizar('user-1', {
                ultimoCambioNombreUsuario,
                ultimoCambioNombre,
                estado: 'ACTIVO',
                perfilCompletadoReconocido: true,
                perfilArtista: {
                    redesSociales: [
                        { redSocialId: 'wa', codigoTelefono: '+34' }, // codigoTelefono only
                        { redSocialId: 'wa2', numeroTelefono: '666666666' }, // numeroTelefono only
                        { redSocialId: 'wa3', codigoTelefono: '+51', numeroTelefono: '999999999' } // both
                    ]
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    ultimoCambioNombreUsuario,
                    ultimoCambioNombre,
                    estado: 'ACTIVO',
                    perfilCompletadoReconocido: true,
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                redesSociales: {
                                    create: [
                                        { redSocialId: 'wa', nombreUsuario: '+34', creadoPor: 'user-1' },
                                        { redSocialId: 'wa2', nombreUsuario: '666666666', creadoPor: 'user-1' },
                                        { redSocialId: 'wa3', nombreUsuario: '+51999999999', creadoPor: 'user-1' }
                                    ]
                                }
                            })
                        })
                    })
                })
            }));
        });

        it('actualizar: should update nombre and imagen if provided', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);

            await repository.actualizar('user-1', {
                nombre: 'New Name',
                imagen: 'https://example.com/image.png'
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    nombre: 'New Name',
                    imagen: 'https://example.com/image.png'
                })
            }));
        });

        it('actualizar: should not invalidate new cache key if username is unchanged', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testuser' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testuser' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);

            await repository.actualizar('user-1', {
                nombreUsuario: 'testuser'
            });

            expect(redisService.del).toHaveBeenCalledTimes(1);
            expect(redisService.del).toHaveBeenCalledWith('user:profile:testuser');
        });

        it('actualizar: should handle when old username is missing', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: null };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);

            await repository.actualizar('user-1', {
                nombreUsuario: 'testnew'
            });

            expect(redisService.del).toHaveBeenCalledTimes(1);
            expect(redisService.del).toHaveBeenCalledWith('user:profile:testnew');
        });

        it('actualizar: should update fechaEliminacionProgramada if provided', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);

            const deleteDate = new Date();
            await repository.actualizar('user-1', {
                fechaEliminacionProgramada: deleteDate
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    fechaEliminacionProgramada: deleteDate
                })
            }));
        });

        it('actualizar: should skip deleting images if new image values match old ones or if profiles are empty', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            
            // Mock deleteOldPagoQR scenarios:
            // 1. existingProfile is null
            // 2. existingProfile.pagoQR matches new QR
            vi.mocked(prisma.perfilArtista.findUnique)
                .mockResolvedValueOnce(null) // first call inside preparePerfilArtistaUpsert -> buildNestedUpdate -> deleteOldPagoQR
                .mockResolvedValueOnce(null); // second call inside deleteOldGaleria
            vi.mocked((prisma as any).categoriaArtista.findFirst).mockResolvedValueOnce({ id: 'default-cat-id', nombre: 'Solista' });

            await repository.actualizar('user-1', {
                perfilArtista: {
                    pagoQR: 'https://example.com/pago_qr.jpg',
                    redesSociales: [],
                    metodosDonacion: [],
                    galeria: []
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalled();
            expect((globalThis as any).mockDeleteImageImpl).not.toHaveBeenCalled();
        });

        it('actualizar: should fallback when defaultCat is null in preparePerfilArtistaUpsert', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);
            vi.mocked((prisma as any).categoriaArtista.findFirst).mockResolvedValueOnce(null);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    pagoQR: 'https://example.com/pago_qr.jpg',
                    redesSociales: [],
                    metodosDonacion: [],
                    galeria: []
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalled();
        });

        it('actualizar: should use provided categoriaId or categoria', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            // Test case 1: categoriaId is provided
            await repository.actualizar('user-1', {
                perfilArtista: {
                    categoriaId: 'some-provided-cat-id',
                    redesSociales: [],
                    metodosDonacion: [],
                    galeria: []
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                categoriaId: 'some-provided-cat-id'
                            })
                        })
                    })
                })
            }));

            // Test case 2: categoria is provided instead of categoriaId
            await repository.actualizar('user-1', {
                perfilArtista: {
                    categoria: 'some-provided-cat-name',
                    redesSociales: [],
                    metodosDonacion: [],
                    galeria: []
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                categoriaId: 'some-provided-cat-name'
                            })
                        })
                    })
                })
            }));
        });

        it('actualizar: should map redesSociales with fallback to phone number', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    redesSociales: [
                        { redSocialId: 'wa', codigoTelefono: '+51', numeroTelefono: '999999999' },
                        { redSocialId: 'fb' } // empty
                    ]
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                redesSociales: {
                                    create: [
                                        { redSocialId: 'wa', nombreUsuario: '+51999999999', creadoPor: 'user-1' },
                                        { redSocialId: 'fb', nombreUsuario: '', creadoPor: 'user-1' }
                                    ]
                                }
                            })
                        })
                    })
                })
            }));
        });

        it('actualizar: should map redesSociales with partial phone fallbacks', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    redesSociales: [
                        { redSocialId: 'wa', numeroTelefono: '666666666' } // no codigoTelefono
                    ]
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                redesSociales: {
                                    create: [
                                        { redSocialId: 'wa', nombreUsuario: '666666666', creadoPor: 'user-1' }
                                    ]
                                }
                            })
                        })
                    })
                })
            }));
        });

        it('actualizar: should map metodosDonacion using alternative field fallbacks', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    metodosDonacion: [
                        { metodoDonacionId: 'd1', numeroCuenta: '123' },
                        { metodoDonacionId: 'd2', identificador: 'ident-456' },
                        { metodoDonacionId: 'd3', numeroTelefono: '789' }
                    ]
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                metodosDonacion: {
                                    create: [
                                        { metodoDonacionId: 'd1', numeroCuenta: '123', creadoPor: 'user-1' },
                                        { metodoDonacionId: 'd2', numeroCuenta: 'ident-456', creadoPor: 'user-1' },
                                        { metodoDonacionId: 'd3', numeroCuenta: '789', creadoPor: 'user-1' }
                                    ]
                                }
                            })
                        })
                    })
                })
            }));
        });

        it('actualizar: should map metodosDonacion using empty string fallback if all alternative fields are missing', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue(null);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    metodosDonacion: [
                        { metodoDonacionId: 'd1' } // no fields provided
                    ]
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    perfilArtista: expect.objectContaining({
                        upsert: expect.objectContaining({
                            create: expect.objectContaining({
                                metodosDonacion: {
                                    create: [
                                        { metodoDonacionId: 'd1', numeroCuenta: '', creadoPor: 'user-1' }
                                    ]
                                }
                            })
                        })
                    })
                })
            }));
        });

        it('actualizar: should handle perfilPublico and perfilDiscoteca update, and ignore cache deletion errors', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(redisService.del).mockRejectedValue(new Error('Redis delete error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const result = await repository.actualizar('user-1', {
                nombreUsuario: 'testnew',
                perfilPublico: {
                    ciudad: 'Lima',
                    pais: 'PE',
                    zonaHoraria: 'America/Lima'
                },
                perfilDiscoteca: {
                    nombreComercial: 'Discoteca Test',
                    ciudad: 'Lima',
                    pais: 'PE',
                    zonaHoraria: 'America/Lima'
                }
            });

            expect(prisma.usuario.update).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Error invalidating cache:', expect.any(Error));
            expect(result.nombreUsuario).toBe('testnew');
            consoleSpy.mockRestore();
        });

        it('actualizar: should log error if LocalFileService.deleteImage fails', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1', pagoQR: 'https://example.com/upload/v123/pago_qr_old.jpg' } as any);
            vi.mocked(prisma.galeriaArtista.findMany).mockResolvedValue([{ urlImagen: 'https://example.com/uploads/users/123/galeria/img_old.png' }] as any);

            (globalThis as any).mockDeleteImageImpl.mockRejectedValue(new Error('Delete image failed'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await repository.actualizar('user-1', {
                perfilArtista: {
                    pagoQR: 'https://example.com/upload/v123/pago_qr.jpg',
                    galeria: [
                        'https://example.com/uploads/users/123/galeria/img1.png'
                    ]
                }
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error deleting QR image:', expect.any(Error));
            expect(consoleSpy).toHaveBeenCalledWith('Error deleting images:', expect.any(Error));
            consoleSpy.mockRestore();
        });

        it('actualizar: should handle null publicId extraction in deleteOldPagoQR', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1', pagoQR: 'not-cloudinary-url' } as any);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    pagoQR: 'https://example.com/pago_qr.jpg'
                }
            });

            expect((globalThis as any).mockDeleteImageImpl).not.toHaveBeenCalled();
        });

        it('actualizar: should handle empty existingGallery in deleteOldGaleria', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1' } as any);
            vi.mocked(prisma.galeriaArtista.findMany).mockResolvedValue([]);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    galeria: ['img1']
                }
            });

            expect((globalThis as any).mockDeleteImageImpl).not.toHaveBeenCalled();
        });

        it('actualizar: should correctly handle when existingGallery has images but extraction results in null publicId', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            vi.mocked(prisma.perfilArtista.findUnique).mockResolvedValue({ id: 'profile-1' } as any);
            vi.mocked(prisma.galeriaArtista.findMany).mockResolvedValue([{ urlImagen: 'bad-url' }] as any);

            await repository.actualizar('user-1', {
                perfilArtista: {
                    galeria: ['img1']
                }
            });

            expect((globalThis as any).mockDeleteImageImpl).not.toHaveBeenCalled();
        });

        it('actualizar: should cache user status in Redis when estado is provided', async () => {
            const mockUserBefore = { id: 'user-1', nombreUsuario: 'testold' };
            const mockUserAfter = { id: 'user-1', nombreUsuario: 'testnew', estado: 'BANEADO' };

            vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockUserBefore as any);
            vi.mocked(prisma.usuario.update).mockResolvedValue(mockUserAfter as any);
            const redisSetSpy = vi.spyOn(redisService, 'set').mockResolvedValue(undefined);

            await repository.actualizar('user-1', {
                estado: 'BANEADO'
            });

            expect(redisSetSpy).toHaveBeenCalledWith('user:user-1:status', 'BANEADO', 86400);
        });
    });

    describe('bloquear and desbloquear', () => {
        it('bloquear and desbloquear: should insert and delete blocker relationship', async () => {
            vi.mocked(prisma.bloqueo.create).mockResolvedValue({} as any);
            await repository.bloquear('blocker', 'blocked');
            expect(prisma.bloqueo.create).toHaveBeenCalledWith({
                data: {
                    bloqueadorId: 'blocker',
                    bloqueadoId: 'blocked',
                    creadoPor: 'blocker'
                }
            });

            vi.mocked(prisma.bloqueo.deleteMany).mockResolvedValue({ count: 1 });
            await repository.desbloquear('blocker', 'blocked');
            expect(prisma.bloqueo.deleteMany).toHaveBeenCalledWith({
                where: {
                    bloqueadorId: 'blocker',
                    bloqueadoId: 'blocked'
                }
            });
        });
    });

    describe('obtenerBloqueados', () => {
        it('obtenerBloqueados: should retrieve and map list of blocked users', async () => {
            const mockBloqueos = [
                { bloqueado: { id: 'blocked-1', correo: 'b1@test.com' } },
                { bloqueado: { id: 'blocked-2', correo: 'b2@test.com' } }
            ];
            vi.mocked(prisma.bloqueo.findMany).mockResolvedValue(mockBloqueos as any);

            const result = await repository.obtenerBloqueados('blocker-1');
            expect(result.length).toBe(2);
            expect(result[0].id).toBe('blocked-1');
        });
    });

    describe('buscarArtistas', () => {
        it('buscarArtistas: should find active artists according to all filters (termino, paisId, usuarioSolicitanteId)', async () => {
            const mockArtists = [
                { id: 'artist-1', rol: { nombre: 'ARTISTA' } }
            ];
            vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockArtists as any);

            const result = await repository.buscarArtistas({
                termino: 'test',
                paisId: 'PE',
                usuarioSolicitanteId: 'solicitor-1'
            });

            expect(result.length).toBe(1);
            expect(prisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    rol: { nombre: 'ARTISTA' },
                    estado: 'ACTIVO',
                    bloqueados: { none: { bloqueadoId: 'solicitor-1' } },
                    bloqueadoPor: { none: { bloqueadorId: 'solicitor-1' } },
                    AND: expect.arrayContaining([
                        { OR: [{ nombre: { contains: 'test' } }, { nombreUsuario: { contains: 'test' } }] },
                        { pais: { contains: 'PE' } }
                    ])
                })
            }));
        });

        it('buscarArtistas: should query without optional filters', async () => {
            const mockArtists = [
                { id: 'artist-1', rol: { nombre: 'ARTISTA' } }
            ];
            vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockArtists as any);

            const result = await repository.buscarArtistas({});
            expect(result.length).toBe(1);
            expect(prisma.usuario.findMany).toHaveBeenCalledWith({
                where: {
                    rol: { nombre: 'ARTISTA' },
                    estado: 'ACTIVO',
                    AND: [{}, {}]
                },
                include: expect.any(Object)
            });
        });
    });

    describe('obtenerPaises and obtenerCiudades', () => {
        it('obtenerPaises and obtenerCiudades: should return empty lists', async () => {
            expect(await repository.obtenerPaises()).toEqual([]);
            expect(await repository.obtenerCiudades('PE')).toEqual([]);
        });
    });

    describe('listarUsuarios', () => {
        it('listarUsuarios: should return user page and total count', async () => {
            const mockUsers = [
                { id: 'user-1', correo: 'u1@test.com' }
            ];
            vi.mocked(prisma.usuario.findMany).mockResolvedValue(mockUsers as any);
            vi.mocked(prisma.usuario.count).mockResolvedValue(10);

            const result = await repository.listarUsuarios(1, 10, 'search');
            expect(result.total).toBe(10);
            expect(result.usuarios.length).toBe(1);
            expect(result.usuarios[0].id).toBe('user-1');
            expect(prisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {
                    OR: [
                        { nombre: { contains: 'search' } },
                        { correo: { contains: 'search' } },
                        { nombreUsuario: { contains: 'search' } },
                        { rol: { nombre: { contains: 'search' } } },
                        { perfilDiscoteca: { nombreLocal: { contains: 'search' } } }
                    ]
                }
            }));
        });

        it('listarUsuarios: should return user page without search term', async () => {
            vi.mocked(prisma.usuario.findMany).mockResolvedValue([]);
            vi.mocked(prisma.usuario.count).mockResolvedValue(0);

            await repository.listarUsuarios();
            expect(prisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {}
            }));
        });
    });

    describe('eliminarPermanente', () => {
        it('eliminarPermanente: should delete user', async () => {
            vi.mocked(prisma.usuario.delete).mockResolvedValue({} as any);
            await repository.eliminarPermanente('user-1');
            expect(prisma.usuario.delete).toHaveBeenCalledWith({
                where: { id: 'user-1' }
            });
        });
    });

    describe('extractPublicIdFromUrl', () => {
        it('extractPublicIdFromUrl: handles unexpected paths or errors gracefully', () => {
            const badUrl = 'not-a-url';
            const result = (repository as any).extractPublicIdFromUrl(badUrl);
            expect(result).toBeNull();
            
            // Trigger try/catch block with invalid arguments
            const errorResult = (repository as any).extractPublicIdFromUrl(undefined);
            expect(errorResult).toBeNull();
        });

        it('extractPublicIdFromUrl: handles local uploads without match or regex fail', () => {
            const resultNullMatch = (repository as any).extractPublicIdFromUrl('/uploads/noextension');
            expect(resultNullMatch).toBeNull();
            
            const resultCloudinaryNullMatch = (repository as any).extractPublicIdFromUrl('https://example.com/upload/noextension');
            expect(resultCloudinaryNullMatch).toBeNull();
        });
    });
});
