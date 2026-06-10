export interface Usuario {
    id: string;
    correo: string;
    nombre?: string | null;
    imagen?: string | null;
    rol?: { id: string; nombre: string } | null;
    perfilArtista?: {
        id: string;
        biografia?: string | null;
        categoria?: string | null;
        musicQR?: string | null;
        pagoQR?: string | null;
        nombreQR?: string | null;
        urlPago?: string | null;
        urlYoutubeFavorito?: string | null;
        urlSoundCloudFavorito?: string | null;
        pedidosActivos?: boolean;
        redesSociales?: Array<{
            id: string;
            nombreUsuario: string;
            redSocial: {
                id: string;
                nombre: string;
                urlBase: string;
                icono?: string | null;
            }
        }>;
        metodosDonacion?: Array<{
            id: string;
            numeroCuenta?: string | null;
            metodoDonacion: {
                id: string;
                nombre: string;
            }
        }>;
        galeria?: Array<{
            id: string;
            urlImagen: string;
        }>;
        [key: string]: unknown;
    };
    perfilPublico?: Record<string, unknown>;
    perfilDiscoteca?: Record<string, unknown> & {
        nombreLocal?: string | null;
    };
    nombreUsuario?: string | null;
    // Campos centralizados (antes estaban en los perfiles)
    zonaHoraria?: string | null;
    codigoTelefono?: string | null;
    numeroTelefono?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    generosFavoritos?: string[];
    creadoEn: Date;
    actualizadoEn: Date;
    ultimoCambioNombreUsuario?: Date | null;
    ultimoCambioNombre?: Date | null;
    estado?: 'ACTIVO' | 'DESHABILITADO' | 'ELIMINACION_PENDIENTE' | 'BANEADO';
    fechaEliminacionProgramada?: Date | null;
    perfilCompletadoReconocido?: boolean;
}

export interface Rol {
    id: string;
    nombre: string;
}

export interface CrearUsuarioDTO {
    correo: string;
    nombre?: string;
    imagen?: string;
    zonaHoraria: string;   // Obligatorio solo en nuevo registro (primer login Google)
    // Campos opcionales adicionales
    nombreUsuario?: string;
    rol?: string; // nombre del rol seleccionado
    // Centralizados
    codigoTelefono?: string | null;
    numeroTelefono?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    generosFavoritos?: string[];
}

export interface ActualizarUsuarioDTO {
    nombre?: string;
    imagen?: string;
    rol?: string;                     // Nombre del rol
    rolId?: string;                   // ID del rol (asignado al escoger perfil)
    nombreUsuario?: string;
    ultimoCambioNombreUsuario?: Date;
    ultimoCambioNombre?: Date;
    estado?: 'ACTIVO' | 'DESHABILITADO' | 'ELIMINACION_PENDIENTE' | 'BANEADO';
    fechaEliminacionProgramada?: Date | null;
    // Campos centralizados (antes en perfiles)
    zonaHoraria?: string;
    codigoTelefono?: string | null;
    numeroTelefono?: string | null;
    ciudad?: string | null;
    pais?: string | null;
    generosFavoritos?: string[];
    // QR y pagos del artista (se mantienen aquí por conveniencia del flujo)
    pagoQR?: string;
    musicQR?: string;
    nombreQR?: string;
    urlPago?: string;
    perfilCompletadoReconocido?: boolean;
    // Opcionales para actualizar perfiles (se mantienen por compatibilidad)
    perfilArtista?: any;
    perfilPublico?: any;
    perfilDiscoteca?: any;
}
