import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, refreshSchema } from './auth.schema';

describe('Auth Schemas Validation', () => {
    describe('loginSchema', () => {
        it('debería validar correctamente un idToken válido', () => {
            const data = { idToken: 'valid-token' };
            const result = loginSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('debería fallar si no se proporciona el idToken', () => {
            const result = loginSchema.safeParse({});
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.idToken).toContain('El idToken es requerido');
            }
        });

        it('debería fallar si el idToken está vacío', () => {
            const result = loginSchema.safeParse({ idToken: '' });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.idToken).toContain('El idToken es requerido');
            }
        });
    });

    describe('registerSchema', () => {
        it('debería validar correctamente un registro válido', () => {
            const data = {
                idToken: 'valid-token',
                zonaHoraria: 'America/Bogota',
            };
            const result = registerSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('debería fallar si falta algún campo obligatorio', () => {
            const result = registerSchema.safeParse({
                zonaHoraria: 'America/Bogota',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.idToken).toContain('El idToken es requerido');
            }
        });

        it('debería fallar si el idToken está vacío', () => {
            const result = registerSchema.safeParse({
                idToken: '',
                zonaHoraria: 'America/Bogota',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                const errors = result.error.flatten().fieldErrors;
                expect(errors.idToken).toContain('El idToken es requerido');
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
