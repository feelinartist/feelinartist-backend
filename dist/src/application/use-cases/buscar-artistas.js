"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuscarArtistasCasoUso = void 0;
class BuscarArtistasCasoUso {
    constructor(repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
    }
    async ejecutar(filtro) {
        return this.repositorioUsuario.buscarArtistas(filtro);
    }
}
exports.BuscarArtistasCasoUso = BuscarArtistasCasoUso;
