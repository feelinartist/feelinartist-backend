import { describe, it, expect } from 'vitest';
import { updateRoleSchema, updateProfileSchema, usernameCheckSchema, blockUserSchema, searchArtistsSchema } from './user.schema';

describe('user.schema', () => {
    describe('updateRoleSchema', () => {
        const validBaseData = {
            nombreUsuario: 'testuser',
            zonaHoraria: 'America/Lima',
        };

        it('should fail with invalid role', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'INVALID_ROLE',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Rol inválido');
            }
        });

        it('should validate PUBLICO role with correct fields', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'PUBLICO',
                nombre: 'John Doe',
            });
            expect(result.success).toBe(true);
        });

        it('should validate PUBLICO role with correct fields', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'PUBLICO',
            });
            expect(result.success).toBe(true);
        });

        it('should validate ARTISTA role with correct fields', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'ARTISTA',
                categoria: 'SOLISTA',
            });
            expect(result.success).toBe(true);
        });

        it('should fail ARTISTA role without categoria', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'ARTISTA',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const error = result.error.issues.find(e => e.path.includes('categoria'));
                expect(error?.message).toBe('La categoría es requerida');
            }
        });

        it('should validate DISCOTECA role with correct fields (using ciudadId/paisId)', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'DISCOTECA',
                ciudadId: 'city-123',
                paisId: 'PE',
            });
            expect(result.success).toBe(true);
        });

        it('should validate DISCOTECA role with correct fields (using ciudad/pais)', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'DISCOTECA',
                ciudad: 'Lima',
                pais: 'Perú',
            });
            expect(result.success).toBe(true);
        });

        it('should fail DISCOTECA role without ciudad or ciudadId', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'DISCOTECA',
                pais: 'Perú',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const error = result.error.issues.find(e => e.path.includes('ciudad'));
                expect(error?.message).toBe('La ciudad es requerida');
            }
        });

        it('should fail DISCOTECA role without pais or paisId', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'DISCOTECA',
                ciudad: 'Lima',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const error = result.error.issues.find(e => e.path.includes('pais'));
                expect(error?.message).toBe('El país es requerido');
            }
        });

        it('should fail with non-string for nombreUsuario', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'PUBLICO',
                nombreUsuario: 12345,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const error = result.error.issues.find(e => e.path.includes('nombreUsuario'));
                expect(error?.message).toBe('El nombre de usuario (@usuario) debe ser texto');
            }
        });

        it('should fail with non-string for zonaHoraria', () => {
            const result = updateRoleSchema.safeParse({
                ...validBaseData,
                rol: 'PUBLICO',
                zonaHoraria: true,
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const error = result.error.issues.find(e => e.path.includes('zonaHoraria'));
                expect(error?.message).toBe('Invalid input: expected string, received boolean');
            }
        });

        it('should fail when rol is missing', () => {
            const result = updateRoleSchema.safeParse({
                correo: 'test@example.com',
                nombreUsuario: 'testuser',
                zonaHoraria: 'America/Lima',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const error = result.error.issues.find(e => e.path.includes('rol'));
                expect(error?.message).toContain('Rol inválido');
            }
        });
    });

    describe('updateProfileSchema', () => {
        it('should fail with invalid uuid for usuarioId', () => {
            const result = updateProfileSchema.safeParse({
                usuarioId: 'not-a-uuid',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('ID de usuario inválido');
            }
        });

        it('should validate correctly with valid fields', () => {
            const result = updateProfileSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                nombre: 'New Name',
                galeria: [{ urlImagen: 'http://example.com/img.jpg' }],
            });
            expect(result.success).toBe(true);
        });
    });

    describe('usernameCheckSchema', () => {
        it('should fail if username is too short', () => {
            const result = usernameCheckSchema.safeParse({
                nombreUsuario: 'ab',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('El nombre de usuario debe tener al menos 3 caracteres');
            }
        });

        it('should validate correct username', () => {
            const result = usernameCheckSchema.safeParse({
                nombreUsuario: 'abc',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('blockUserSchema', () => {
        it('should validate correct uuids', () => {
            const result = blockUserSchema.safeParse({
                bloqueadorId: '123e4567-e89b-12d3-a456-426614174000',
                bloqueadoId: '123e4567-e89b-12d3-a456-426614174001',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('searchArtistsSchema', () => {
        it('should transform page and limit to numbers', () => {
            const result = searchArtistsSchema.safeParse({
                termino: 'pop',
                page: '2',
                limit: '15',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(2);
                expect(result.data.limit).toBe(15);
            }
        });
    });
});
