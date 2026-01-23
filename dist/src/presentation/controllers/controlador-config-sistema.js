"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorConfigSistema = void 0;
const prisma_config_sistema_repository_1 = require("../../infrastructure/repositories/prisma-config-sistema-repository");
class ControladorConfigSistema {
    constructor() {
        // Middleware to check if user is SUPERADMIN or ADMIN
        this.verificarAcceso = (req, res, next) => {
            const user = req.user;
            const userRole = user?.rol; // Assuming user is attached to request
            if (userRole !== 'SUPERADMIN' && userRole !== 'ADMIN') {
                return res.status(403).json({ error: "Acceso denegado. Solo SUPERADMIN y ADMIN pueden acceder." });
            }
            next();
        };
        this.listarTodas = async (req, res) => {
            try {
                const configs = await this.configRepository.obtenerTodas();
                return res.json(configs);
            }
            catch (error) {
                console.error("Error al listar configuraciones:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.obtenerPorClave = async (req, res) => {
            try {
                const { clave } = req.params;
                const config = await this.configRepository.obtenerPorClave(clave);
                if (!config) {
                    return res.status(404).json({ error: "Configuración no encontrada" });
                }
                return res.json(config);
            }
            catch (error) {
                console.error("Error al obtener configuración:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.crear = async (req, res) => {
            try {
                const { clave, valor, descripcion } = req.body;
                const userId = req.user?.id;
                if (!clave || !valor) {
                    return res.status(400).json({ error: "Clave y valor son requeridos" });
                }
                const config = await this.configRepository.crear({
                    clave,
                    valor,
                    descripcion,
                    creadoPor: userId
                });
                return res.status(201).json(config);
            }
            catch (error) {
                console.error("Error al crear configuración:", error);
                const err = error;
                if (err.code === 'P2002') {
                    return res.status(400).json({ error: "Ya existe una configuración con esa clave" });
                }
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.actualizar = async (req, res) => {
            try {
                const { id } = req.params;
                const { valor } = req.body;
                const userId = req.user?.id;
                if (!valor) {
                    return res.status(400).json({ error: "Valor es requerido" });
                }
                const config = await this.configRepository.actualizar(id, valor, userId);
                return res.json(config);
            }
            catch (error) {
                console.error("Error al actualizar configuración:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.eliminar = async (req, res) => {
            try {
                const { id } = req.params;
                await this.configRepository.eliminar(id);
                return res.json({ message: "Configuración eliminada correctamente" });
            }
            catch (error) {
                console.error("Error al eliminar configuración:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.configRepository = new prisma_config_sistema_repository_1.PrismaConfigSistemaRepository();
    }
}
exports.ControladorConfigSistema = ControladorConfigSistema;
