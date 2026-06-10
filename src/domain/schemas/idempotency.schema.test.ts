import { describe, expect, it } from 'vitest';
import { idempotencySchema } from './idempotency.schema';

describe('idempotencySchema', () => {
    it('debería validar correctamente un UUID válido', () => {
        const result = idempotencySchema.safeParse({ idempotencyKey: '123e4567-e89b-12d3-a456-426614174000' });
        expect(result.success).toBe(true);
    });

    it('debería fallar si idempotencyKey es undefined', () => {
        const result = idempotencySchema.safeParse({});
        expect(result.success).toBe(false);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            expect(errors.idempotencyKey).toContain('La cabecera Idempotency-Key es obligatoria para esta ruta.');
        }
    });

    it('debería fallar si idempotencyKey es un string vacío', () => {
        const result = idempotencySchema.safeParse({ idempotencyKey: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            expect(errors.idempotencyKey).toContain('La cabecera Idempotency-Key es obligatoria para esta ruta.');
        }
    });

    it('debería fallar si idempotencyKey no es un UUID válido', () => {
        const result = idempotencySchema.safeParse({ idempotencyKey: 'invalid-uuid' });
        expect(result.success).toBe(false);
        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;
            expect(errors.idempotencyKey).toContain('Idempotency-Key debe ser un UUID válido.');
        }
    });
});
