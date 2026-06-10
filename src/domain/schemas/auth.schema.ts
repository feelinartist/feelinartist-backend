import { z } from 'zod';

export const loginSchema = z.object({
    idToken: z.string({
        message: 'El idToken es requerido',
    }).min(1, 'El idToken es requerido'),
});

export const registerSchema = z.object({
    idToken: z.string({
        message: 'El idToken es requerido',
    }).min(1, 'El idToken es requerido'),
    zonaHoraria: z.string({
        message: 'La zona horaria es requerida',
    })
    .min(1, 'La zona horaria es requerida'),
});

export const refreshSchema = z.object({
    refreshToken: z.string({
        message: 'Token de refresco requerido',
    })
    .min(1, 'Token de refresco requerido'),
});
