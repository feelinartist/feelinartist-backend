import { z } from 'zod';

export const idempotencySchema = z.object({
    idempotencyKey: z.uuid({
        error: (issue) => issue.input === undefined || issue.input === ''
            ? "La cabecera Idempotency-Key es obligatoria para esta ruta."
            : "Idempotency-Key debe ser un UUID válido."
    }),
});
