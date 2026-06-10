import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, refreshSchema } from './auth.schema';

describe('Auth Schemas Validation', () => {
    describe('loginSchema', () => {
        it('debería validar correctamente un correo válido', () => {
            const data = { correo: 'test@example.com' };
            const result = loginSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('debería fallar si no se proporciona el correo', () => {
            const result = loginSchema.safeParse({});
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.correo).toContain('El correo es requerido');
            }
        });

        it('debería fallar si el correo no tiene un formato válido', () => {
            const result = loginSchema.safeParse({ correo: 'invalido' });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.correo).toContain('El correo debe ser un correo válido');
            }
        });

        it('debería fallar si el correo está vacío', () => {
            const result = loginSchema.safeParse({ correo: '' });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.correo).toContain('El correo es requerido');
            }
        });
    });

    describe('registerSchema', () => {
        it('debería validar correctamente un registro válido', () => {
            const data = {
                correo: 'test@example.com',
                nombre: 'John Doe',
                imagen: 'http://example.com/img.jpg',
                zonaHoraria: 'America/Bogota',
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('debería fallar si falta algún campo obligatorio', () => {
            const result = registerSchema.safeParse({
                correo: 'test@example.com',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.nombre).toContain('El nombre es requerido');
                expect(errors.imagen).toContain('La imagen es requerida');
                expect(errors.zonaHoraria).toContain('La zona horaria es requerida');
            }
        });

        it('debería fallar si el correo está vacío', () => {
            const result = registerSchema.safeParse({
                correo: '',
                nombre: 'John Doe',
                imagen: 'http://example.com/img.jpg',
                zonaHoraria: 'America/Bogota',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.correo).toContain('El correo es requerido');
            }
        });

        it('debería fallar si el correo tiene un formato inválido', () => {
            const result = registerSchema.safeParse({
                correo: 'invalido',
                nombre: 'John Doe',
                imagen: 'http://example.com/img.jpg',
                zonaHoraria: 'America/Bogota',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.correo).toContain('El correo debe ser un correo válido');
            }
        });
    });

    describe('refreshSchema', () => {
        it('debería validar correctamente si tiene refreshToken', () => {
            const result = refreshSchema.safeParse({ refreshToken: 'some-token' });
            expect(result.success).toBe(true);
        });

        it('debería fallar si no se proporciona el refreshToken', () => {
            const result = refreshSchema.safeParse({});
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.refreshToken).toContain('Token de refresco requerido');
            }
        });
    });
});
