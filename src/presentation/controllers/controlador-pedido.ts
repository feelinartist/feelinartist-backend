
import { Request, Response } from "express";
import { PrismaPedidoRepository } from "../../infrastructure/repositories/prisma-pedido-repository";
import { EstadoPedidoCancion, PrismaClient } from "@prisma/client";

interface SpotifyTrack {
    artists: { id: string }[];
}

interface SpotifyArtist {
    genres?: string[];
}

import { SocketService } from '../../infrastructure/services/socket-service';
import { SpotifyService } from '../../infrastructure/services/spotify-service';

const prisma = new PrismaClient();

export class ControladorPedido {
    private pedidoRepository: PrismaPedidoRepository;

    constructor() {
        this.pedidoRepository = new PrismaPedidoRepository();
    }

    crearPedido = async (req: Request, res: Response) => {
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
            let genero: string | undefined;
            if (spotifyId) {
                try {
                    // SpotifyService ya importado
                    const spotifyService = new SpotifyService();

                    const track = await spotifyService.getTrack(spotifyId) as unknown as SpotifyTrack;
                    if (track?.artists?.[0]?.id) {
                        const artistData = await spotifyService.getArtist(track.artists[0].id) as unknown as SpotifyArtist;
                        if (artistData?.genres && artistData.genres.length > 0) {
                            genero = artistData.genres.join(', ');
                        }
                    }
                } catch (error) {
                    console.error("Error fetching genre from Spotify:", error);
                    // Continue without genre if Spotify fails
                }
            }

            const pedido = await this.pedidoRepository.crearPedido(
                eventoId,
                titulo,
                artista,
                usuarioId,
                spotifyId,
                nombreSolicitante,
                genero
            );

            // Emitir evento por Socket.io
            try {
                const io = SocketService.getInstance().getIO();
                io.to(`event:${eventoId}`).emit('nuevo_pedido', pedido);
            } catch (error) {
                console.error('Error emitiendo socket:', error);
            }

            return res.status(201).json(pedido);
        } catch (error) {
            console.error("Error al crear pedido:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    obtenerPedidosPorEvento = async (req: Request, res: Response) => {
        try {
            const { eventoId } = req.params;
            const pedidos = await this.pedidoRepository.obtenerPedidosPorEvento(eventoId);
            return res.json(pedidos);
        } catch (error) {
            console.error("Error al obtener pedidos:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };

    actualizarEstado = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!Object.values(EstadoPedidoCancion).includes(estado)) {
                return res.status(400).json({ error: "Estado inválido" });
            }

            const pedido = await this.pedidoRepository.actualizarEstado(id, estado);
            return res.json(pedido);
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    };
}
