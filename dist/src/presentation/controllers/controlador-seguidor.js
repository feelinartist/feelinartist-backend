"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorSeguidor = void 0;
const seguir_usuario_1 = require("../../application/use-cases/seguir-usuario");
const dejar_de_seguir_usuario_1 = require("../../application/use-cases/dejar-de-seguir-usuario");
const prisma_seguidor_repository_1 = require("../../infrastructure/repositories/prisma-seguidor-repository");
const repositorioSeguidor = new prisma_seguidor_repository_1.RepositorioSeguidorPrisma();
const seguirUsuarioCasoUso = new seguir_usuario_1.SeguirUsuarioCasoUso(repositorioSeguidor);
const dejarDeSeguirUsuarioCasoUso = new dejar_de_seguir_usuario_1.DejarDeSeguirUsuarioCasoUso(repositorioSeguidor);
class ControladorSeguidor {
    async seguir(req, res) {
        try {
            const { seguidorId, seguidoId, tipo } = req.body;
            if (!seguidorId || !seguidoId || !tipo) {
                return res.status(400).json({ message: 'Faltan datos requeridos' });
            }
            await seguirUsuarioCasoUso.ejecutar(seguidorId, seguidoId, tipo);
            return res.status(200).json({ message: 'Usuario seguido exitosamente' });
        }
        catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message || 'Error al seguir usuario' });
        }
    }
    async dejarDeSeguir(req, res) {
        try {
            const { seguidorId, seguidoId, tipo } = req.body;
            if (!seguidorId || !seguidoId || !tipo) {
                return res.status(400).json({ message: 'Faltan datos requeridos' });
            }
            await dejarDeSeguirUsuarioCasoUso.ejecutar(seguidorId, seguidoId, tipo);
            return res.status(200).json({ message: 'Dejado de seguir exitosamente' });
        }
        catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message || 'Error al dejar de seguir usuario' });
        }
    }
}
exports.ControladorSeguidor = ControladorSeguidor;
