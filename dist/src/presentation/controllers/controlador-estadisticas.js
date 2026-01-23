"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorEstadisticas = void 0;
const estadisticas_service_1 = require("../../application/services/estadisticas-service");
class ControladorEstadisticas {
    constructor() {
        /**
         * GET /api/estadisticas/evento/:eventoId
         * Obtiene estadísticas de un evento específico
         */
        this.obtenerEstadisticasEvento = async (req, res) => {
            try {
                const { eventoId } = req.params;
                if (!eventoId) {
                    return res.status(400).json({ error: "EventoId es requerido" });
                }
                const estadisticas = await this.estadisticasService.obtenerEstadisticasEvento(eventoId);
                return res.json(estadisticas);
            }
            catch (error) {
                console.error("Error al obtener estadísticas del evento:", error);
                const err = error;
                if (err.message === "Evento no encontrado") {
                    return res.status(404).json({ error: err.message });
                }
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        /**
         * GET /api/estadisticas/artista/:perfilArtistaId
         * Obtiene estadísticas globales de un artista
         */
        this.obtenerEstadisticasArtista = async (req, res) => {
            try {
                const { perfilArtistaId } = req.params;
                if (!perfilArtistaId) {
                    return res.status(400).json({ error: "PerfilArtistaId es requerido" });
                }
                const estadisticas = await this.estadisticasService.obtenerEstadisticasArtista(perfilArtistaId);
                return res.json(estadisticas);
            }
            catch (error) {
                console.error("Error al obtener estadísticas del artista:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        /**
         * GET /api/estadisticas/artista/:perfilArtistaId/generos
         * Obtiene solo la distribución de géneros del artista
         */
        this.obtenerGenerosArtista = async (req, res) => {
            try {
                const { perfilArtistaId } = req.params;
                if (!perfilArtistaId) {
                    return res.status(400).json({ error: "PerfilArtistaId es requerido" });
                }
                const estadisticas = await this.estadisticasService.obtenerEstadisticasArtista(perfilArtistaId);
                return res.json({
                    generosPorConteo: estadisticas.generosPorConteo,
                    totalPedidos: estadisticas.totalPedidos
                });
            }
            catch (error) {
                console.error("Error al obtener géneros del artista:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        /**
         * GET /api/estadisticas/artista/:perfilArtistaId/top-canciones
         * Obtiene solo las canciones más pedidas del artista
         */
        this.obtenerTopCanciones = async (req, res) => {
            try {
                const { perfilArtistaId } = req.params;
                const limit = parseInt(req.query.limit) || 20;
                if (!perfilArtistaId) {
                    return res.status(400).json({ error: "PerfilArtistaId es requerido" });
                }
                const estadisticas = await this.estadisticasService.obtenerEstadisticasArtista(perfilArtistaId);
                return res.json({
                    topCanciones: estadisticas.topCanciones.slice(0, limit),
                    totalPedidos: estadisticas.totalPedidos
                });
            }
            catch (error) {
                console.error("Error al obtener top canciones:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        /**
         * GET /api/estadisticas/artista/:perfilArtistaId/canciones
         * Obtiene detalle paginado de todas las canciones del artista
         */
        this.obtenerDetalleCancionesArtista = async (req, res) => {
            try {
                const { perfilArtistaId } = req.params;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 20;
                const search = req.query.search || '';
                const ordenarPor = req.query.ordenarPor || 'pedidas';
                if (!perfilArtistaId) {
                    return res.status(400).json({ error: "PerfilArtistaId es requerido" });
                }
                const result = await this.estadisticasService.obtenerDetalleCancionesArtista(perfilArtistaId, page, limit, search, ordenarPor);
                return res.json(result);
            }
            catch (error) {
                console.error("Error al obtener detalle de canciones:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        /**
         * GET /api/estadisticas/evento/:eventoId/canciones
         * Obtiene detalle paginado de todas las canciones del evento
         */
        this.obtenerDetalleCancionesEvento = async (req, res) => {
            try {
                const { eventoId } = req.params;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 20;
                const search = req.query.search || '';
                const ordenarPor = req.query.ordenarPor || 'pedidas';
                if (!eventoId) {
                    return res.status(400).json({ error: "eventoId es requerido" });
                }
                const result = await this.estadisticasService.obtenerDetalleCancionesEvento(eventoId, page, limit, search, ordenarPor);
                return res.json(result);
            }
            catch (error) {
                console.error("Error al obtener detalle de canciones de evento:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.estadisticasService = new estadisticas_service_1.EstadisticasService();
    }
}
exports.ControladorEstadisticas = ControladorEstadisticas;
