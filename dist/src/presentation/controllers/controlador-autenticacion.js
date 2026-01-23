"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorAutenticacion = void 0;
const crear_usuario_1 = require("../../application/use-cases/crear-usuario");
const prisma_user_repository_1 = require("../../infrastructure/repositories/prisma-user-repository");
const repositorioUsuario = new prisma_user_repository_1.RepositorioUsuarioPrisma();
const crearUsuarioCasoUso = new crear_usuario_1.CrearUsuarioCasoUso(repositorioUsuario);
class ControladorAutenticacion {
    async iniciarSesion(req, res) {
        try {
            const { correo, nombre, imagen } = req.body;
            if (!correo) {
                return res.status(400).json({ message: 'El correo es requerido' });
            }
            // In a real scenario, we would verify the Google token here.
            // For now, we trust the NextAuth session data sent from frontend.
            const usuario = await crearUsuarioCasoUso.ejecutar({ correo, nombre, imagen });
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
exports.ControladorAutenticacion = ControladorAutenticacion;
