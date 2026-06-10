import { z } from 'zod';



// Update role schema — only self-assignable roles allowed
export const updateRoleSchema = z.looseObject({
    rol: z.enum(['ARTISTA', 'PUBLICO', 'DISCOTECA'], {
        error: 'Rol inválido. Debe ser ARTISTA, PUBLICO o DISCOTECA'
    }),
    nombreUsuario: z.string({ error: (issue) => issue.input === undefined ? 'El nombre de usuario (@usuario) es requerido' : 'El nombre de usuario (@usuario) debe ser texto' })
        .min(1, 'El nombre de usuario (@usuario) es requerido'),
    nombre: z.string().optional(),
    nombreArtistico: z.string().optional(),
    categoria: z.string().optional(),
    ciudad: z.string().optional(),
    pais: z.string().optional(),
    ciudadId: z.string().optional(),
    paisId: z.string().optional(),
    zonaHoraria: z.string().optional(),
    imagen: z.string().optional(),
    codigoTelefono: z.string().optional(),
    numeroTelefono: z.string().optional(),
    generosFavoritos: z.array(z.string()).optional(),
    datosPerfilArtista: z.record(z.string(), z.unknown()).optional(),
    datosPerfilPublico: z.record(z.string(), z.unknown()).optional(),
    datosDiscoteca: z.record(z.string(), z.unknown()).optional()
}).superRefine((data, ctx) => {
    if (data.rol === 'ARTISTA') {
        if (!data.categoria || data.categoria.trim() === '') {
            ctx.addIssue({
                code: 'custom',
                path: ['categoria'],
                message: 'La categoría es requerida'
            });
        }
    }
    if (data.rol === 'DISCOTECA') {
        const hasCiudad = (data.ciudad && data.ciudad.trim() !== '') || (data.ciudadId && data.ciudadId.trim() !== '');
        const hasPais = (data.pais && data.pais.trim() !== '') || (data.paisId && data.paisId.trim() !== '');
        if (!hasCiudad) {
            ctx.addIssue({
                code: 'custom',
                path: ['ciudad'],
                message: 'La ciudad es requerida'
            });
        }
        if (!hasPais) {
            ctx.addIssue({
                code: 'custom',
                path: ['pais'],
                message: 'El país es requerido'
            });
        }
    }
});


// Update profile schema
export const updateProfileSchema = z.looseObject({
    usuarioId: z.uuid({ error: 'ID de usuario inválido' }),
    nombre: z.string().optional(),
    nombreUsuario: z.string().optional(),
    imagen: z.string().optional(),
    perfilArtista: z.record(z.string(), z.unknown()).optional(),
    perfilPublico: z.record(z.string(), z.unknown()).optional(),
    perfilDiscoteca: z.record(z.string(), z.unknown()).optional(),
    galeria: z.array(z.object({
        urlImagen: z.string()
    })).optional()
});

// Username check schema
export const usernameCheckSchema = z.object({
    nombreUsuario: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
    usuarioId: z.uuid().optional()
});

// Block/unblock user schema
export const blockUserSchema = z.object({
    bloqueadorId: z.uuid({ error: 'ID de bloqueador inválido' }),
    bloqueadoId: z.uuid({ error: 'ID de bloqueado inválido' })
});

// Search artists schema (query params)
export const searchArtistsSchema = z.object({
    termino: z.string().min(1, 'El término de búsqueda es requerido').optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional()
});
