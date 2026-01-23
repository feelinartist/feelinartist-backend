"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrearUsuarioCasoUso = void 0;
class CrearUsuarioCasoUso {
    constructor(repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }
    async ejecutar(datos) {
        const usuarioExistente = await this.repositorioUsuario.buscarPorCorreo(datos.correo);
        if (usuarioExistente) {
            const updates = {};
            // Reactivate account if disabled or pending deletion
            if (usuarioExistente.estadoCuenta === 'DESHABILITADO' || usuarioExistente.estadoCuenta === 'ELIMINACION_PENDIENTE') {
                updates.estadoCuenta = 'ACTIVO';
                updates.fechaEliminacionProgramada = null;
            }
            // If user exists but doesn't have name, update it
            if (!usuarioExistente.nombre && datos.nombre)
                updates.nombre = datos.nombre;
            // Sync image from Google always, as per user requirement (Strict Sync)
            if (datos.imagen && usuarioExistente.imagen !== datos.imagen) {
                updates.imagen = datos.imagen;
            }
            if (Object.keys(updates).length > 0) {
                return this.repositorioUsuario.actualizar(usuarioExistente.id, updates);
            }
            return usuarioExistente;
        }
        // Generate unique username if not provided
        let nombreUsuario = datos.nombreUsuario;
        if (!nombreUsuario) {
            const base = (datos.nombre || datos.correo.split('@')[0])
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');
            nombreUsuario = base;
            let contador = 1;
            while (await this.repositorioUsuario.buscarPorNombreUsuario(nombreUsuario)) {
                nombreUsuario = `${base}${Math.floor(Math.random() * 10000)}`;
                contador++;
                if (contador > 10)
                    break; // Safety break
            }
        }
        return this.repositorioUsuario.crear({ ...datos, nombreUsuario });
    }
}
exports.CrearUsuarioCasoUso = CrearUsuarioCasoUso;
