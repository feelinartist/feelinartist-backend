"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorPedido = void 0;
const prisma_pedido_repository_1 = require("../../infrastructure/repositories/prisma-pedido-repository");
const client_1 = require("@prisma/client");
const socket_service_1 = require("../../infrastructure/services/socket-service");
const spotify_service_1 = require("../../infrastructure/services/spotify-service");
const prisma = new client_1.PrismaClient();
class ControladorPedido {
    constructor() {
        this.crearPedido = async (req, res) => {
            try {
                const { eventoId, titulo, artista, usuarioId, spotifyId, nombreSolicitante } = req.body;
                if (!eventoId || !titulo) {
                    return res.status(400).json({ error: "EventoId y Título son requeridos" });
                }
                // Validar si el artista está aceptando pedidos
                const evento = await prisma.evento.findUnique({
                    where: { id: eventoId },
                    include: { perfilArtista: true }
                });
                if (!evento) {
                    return res.status(404).json({ error: "Evento no encontrado" });
                }
                if (!evento.perfilArtista.pedidosActivos) {
                    return res.status(403).json({ error: "El artista no está recibiendo pedidos en este momento" });
                }
                // Obtener género de Spotify si hay spotifyId
                let genero;
                if (spotifyId) {
                    try {
                        // SpotifyService ya importado
                        const spotifyService = new spotify_service_1.SpotifyService();
                        const track = await spotifyService.getTrack(spotifyId);
                        if (track?.artists?.[0]?.id) {
                            const artistData = await spotifyService.getArtist(track.artists[0].id);
                            if (artistData?.genres && artistData.genres.length > 0) {
                                genero = artistData.genres.join(', ');
                            }
                        }
                    }
                    catch (error) {
                        console.error("Error fetching genre from Spotify:", error);
                        // Continue without genre if Spotify fails
                    }
                }
                const pedido = await this.pedidoRepository.crearPedido(eventoId, titulo, artista, usuarioId, spotifyId, nombreSolicitante, genero);
                // Emitir evento por Socket.io
                try {
                    const io = socket_service_1.SocketService.getInstance().getIO();
                    io.to(`event:${eventoId}`).emit('nuevo_pedido', pedido);
                }
                catch (error) {
                    console.error('Error emitiendo socket:', error);
                }
                return res.status(201).json(pedido);
            }
            catch (error) {
                console.error("Error al crear pedido:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.obtenerPedidosPorEvento = async (req, res) => {
            try {
                const { eventoId } = req.params;
                const pedidos = await this.pedidoRepository.obtenerPedidosPorEvento(eventoId);
                return res.json(pedidos);
            }
            catch (error) {
                console.error("Error al obtener pedidos:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.actualizarEstado = async (req, res) => {
            try {
                const { id } = req.params;
                const { estado } = req.body;
                if (!Object.values(client_1.EstadoPedidoCancion).includes(estado)) {
                    return res.status(400).json({ error: "Estado inválido" });
                }
                const pedido = await this.pedidoRepository.actualizarEstado(id, estado);
                return res.json(pedido);
            }
            catch (error) {
                console.error("Error al actualizar estado:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        };
        this.pedidoRepository = new prisma_pedido_repository_1.PrismaPedidoRepository();
    }
}
exports.ControladorPedido = ControladorPedido;
