"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObtenerUsuarioPorCorreoCasoUso = void 0;
class ObtenerUsuarioPorCorreoCasoUso {
    constructor(repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }
    async ejecutar(correo) {
        return this.repositorioUsuario.buscarPorCorreo(correo);
    }
}
exports.ObtenerUsuarioPorCorreoCasoUso = ObtenerUsuarioPorCorreoCasoUso;
