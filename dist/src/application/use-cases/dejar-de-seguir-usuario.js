"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DejarDeSeguirUsuarioCasoUso = void 0;
class DejarDeSeguirUsuarioCasoUso {
    constructor(repositorioSeguidor) {
        this.repositorioSeguidor = repositorioSeguidor;
    }
    async ejecutar(seguidorId, seguidoId, tipo) {
        return this.repositorioSeguidor.dejarDeSeguir(seguidorId, seguidoId, tipo);
    }
}
exports.DejarDeSeguirUsuarioCasoUso = DejarDeSeguirUsuarioCasoUso;
