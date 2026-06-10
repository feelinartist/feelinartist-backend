import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario, CrearUsuarioDTO } from '../../domain/entities/user';

export class CrearUsuarioCasoUso {
    constructor(private readonly repositorioUsuario: RepositorioUsuario) { }

    async ejecutar(datos: CrearUsuarioDTO): Promise<Usuario> {
        const usuarioExistente = await this.repositorioUsuario.buscarPorCorreo(datos.correo);
        if (usuarioExistente) {
            const updates: Record<string, unknown> = {};

            // Reactivate account if disabled or pending deletion
            if (usuarioExistente.estado === 'DESHABILITADO' || usuarioExistente.estado === 'ELIMINACION_PENDIENTE') {
                updates.estado = 'ACTIVO';
                updates.fechaEliminacionProgramada = null;
            }

            // If user exists but doesn't have name, update it
            if (!usuarioExistente.nombre && datos.nombre) updates.nombre = datos.nombre;

            // Sync image from Google always, as per user requirement (Strict Sync)
            if (datos.imagen && usuarioExistente.imagen !== datos.imagen) {
                updates.imagen = datos.imagen;
            }

            if (Object.keys(updates).length > 0) {
                return this.repositorioUsuario.actualizar(usuarioExistente.id, updates);
            }
            return usuarioExistente;
        }

        return this.repositorioUsuario.crear(datos);
    }
}

