"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorConfigPublica = void 0;
const config_service_1 = require("../../infrastructure/services/config-service");
class ControladorConfigPublica {
    constructor() {
        this.obtenerCredencialesAuth = async (req, res) => {
            try {
                // Verificar INTERNAL_API_KEY desde la Base de Datos
                const authorizedApiKey = await config_service_1.configService.get('INTERNAL_API_KEY');
                const requestApiKey = req.headers['x-internal-api-key'];
                if (!authorizedApiKey || requestApiKey !== authorizedApiKey) {
                    console.warn(`Intento de acceso no autorizado a config interna. Key recibida: ${requestApiKey ? '***' : 'null'}`);
                    return res.status(403).json({ error: "Acceso denegado" });
                }
                // Obtener variables críticas para el frontend
                const configs = await config_service_1.configService.getMany([
                    'GOOGLE_CLIENT_ID',
                    'GOOGLE_CLIENT_SECRET'
                ]);
                return res.json(configs);
            }
            catch (error) {
                console.error("Error al obtener config interna:", error);
                return res.status(500).json({ error: "Error interno" });
            }
        };
    }
}
exports.ControladorConfigPublica = ControladorConfigPublica;
