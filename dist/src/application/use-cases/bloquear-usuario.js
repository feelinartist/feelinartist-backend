"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloquearUsuarioCasoUso = void 0;
class BloquearUsuarioCasoUso {
    constructor(repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }
    async bloquear(bloqueadorId, bloqueadoId) {
        if (bloqueadorId === bloqueadoId) {
            throw new Error("No puedes bloquearte a ti mismo");
        }
        const bloqueador = await this.repositorioUsuario.buscarPorId(bloqueadorId);
        const bloqueado = await this.repositorioUsuario.buscarPorId(bloqueadoId);
        if (!bloqueador || !bloqueado) {
            throw new Error("Usuario no encontrado");
        }
        await this.repositorioUsuario.bloquear(bloqueadorId, bloqueadoId);
    }
    async desbloquear(bloqueadorId, bloqueadoId) {
        await this.repositorioUsuario.desbloquear(bloqueadorId, bloqueadoId);
    }
    async obtenerBloqueados(bloqueadorId) {
        return this.repositorioUsuario.obtenerBloqueados(bloqueadorId);
    }
}
exports.BloquearUsuarioCasoUso = BloquearUsuarioCasoUso;
