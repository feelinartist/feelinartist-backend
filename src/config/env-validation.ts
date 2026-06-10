import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres para garantizar la seguridad'),
    PORT: z.string().optional().default('3001'),
    FRONTEND_URL: z.url({ error: 'FRONTEND_URL debe ser una URL válida' }).optional().default('http://localhost:3000'),
    REDIS_URL: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Error de validación en las variables de entorno:');
        console.error(JSON.stringify(z.treeifyError(result.error), null, 2));
        process.exit(1);
    }

    return result.data;
}
