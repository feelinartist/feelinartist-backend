"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionCuentaCasoUso = void 0;
class GestionCuentaCasoUso {
    constructor(repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }
    async deshabilitarCuenta(usuarioId) {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'DESHABILITADO'
        });
    }
    async programarEliminacion(usuarioId) {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        const fechaEliminacion = new Date();
        fechaEliminacion.setDate(fechaEliminacion.getDate() + 30);
        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'ELIMINACION_PENDIENTE',
            fechaEliminacionProgramada: fechaEliminacion
        });
    }
    async reactivarCuenta(usuarioId) {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'ACTIVO',
            fechaEliminacionProgramada: null
        });
    }
    async banearUsuario(usuarioId) {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        return this.repositorioUsuario.actualizar(usuarioId, {
            estadoCuenta: 'BANEADO'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }); // Type cast due to possible enum lag in generated types
    }
    async ejecutar(usuarioId, _accion, _motivo) {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        await this.repositorioUsuario.eliminarPermanente(usuarioId);
    }
    async eliminarUsuarioPermanente(usuarioId) {
        const usuario = await this.repositorioUsuario.buscarPorId(usuarioId);
        if (!usuario)
            throw new Error("Usuario no encontrado");
        await this.repositorioUsuario.eliminarPermanente(usuarioId);
    }
}
exports.GestionCuentaCasoUso = GestionCuentaCasoUso;
