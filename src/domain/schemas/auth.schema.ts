import { z } from 'zod';

export const loginSchema = z.object({
    correo: z.email({
        error: (issue) => issue.input === undefined || issue.input === '' ? 'El correo es requerido' : 'El correo debe ser un correo válido'
    }),
    nombre: z.string().optional(),
    imagen: z.string().optional(),
    zonaHoraria: z.string().optional(),
});

export const registerSchema = z.object({
    correo: z.email({
        error: (issue) => issue.input === undefined || issue.input === '' ? 'El correo es requerido' : 'El correo debe ser un correo válido'
    }),
    nombre: z.string({
        message: 'El nombre es requerido',
    })
    .min(1, 'El nombre es requerido'),
    imagen: z.string({
        message: 'La imagen es requerida',
    })
    .min(1, 'La imagen es requerida'),
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
