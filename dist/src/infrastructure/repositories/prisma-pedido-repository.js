"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaPedidoRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaPedidoRepository {
    async crearPedido(eventoId, titulo, artista, usuarioId, spotifyId, nombreSolicitante, genero) {
        // Obtener perfilArtistaId del evento
        const evento = await prisma.evento.findUnique({
            where: { id: eventoId },
            select: { perfilArtistaId: true }
        });
        if (!evento)
            throw new Error("Evento no encontrado");
        const pedido = await prisma.pedidoCancion.create({
            data: {
                eventoId,
                titulo,
                artista,
                usuarioId,
                spotifyId,
                nombreSolicitante,
                genero,
                estado: "PENDIENTE",
                perfilArtistaId: evento.perfilArtistaId
            }
        });
        // Actualizar contadores en EstadisticasCancion
        if (titulo && artista) {
            try {
                // Solo crear el registro, los contadores se incrementan al cambiar estado
                await prisma.estadisticasCancion.upsert({
                    where: {
                        spotifyId_perfilArtistaId: {
                            spotifyId: spotifyId || `manual_${titulo}_${artista}`,
                            perfilArtistaId: evento.perfilArtistaId
                        }
                    },
                    create: {
                        spotifyId: spotifyId || `manual_${titulo}_${artista}`,
                        titulo,
                        artista,
                        genero,
                        perfilArtistaId: evento.perfilArtistaId
                    },
                    update: {
                        // Actualizar género si viene de Spotify y no estaba
                        ...(genero && { genero })
                    }
                });
            }
            catch (error) {
                console.error("Error actualizando estadísticas:", error);
                // No fallamos el pedido si falla la estadística
            }
        }
        return pedido;
    }
    async obtenerPedidosPorEvento(eventoId) {
        return await prisma.pedidoCancion.findMany({
            where: { eventoId },
            orderBy: { creadoEn: 'desc' }
        });
    }
    async actualizarEstado(id, estado) {
        // Obtener pedido anterior para comparar estados
        const pedidoAnterior = await prisma.pedidoCancion.findUnique({
            where: { id },
            select: {
                estado: true,
                spotifyId: true,
                titulo: true,
                artista: true,
                perfilArtistaId: true
            }
        });
        if (!pedidoAnterior)
            throw new Error("Pedido no encontrado");
        if (pedidoAnterior.estado === estado)
            return pedidoAnterior;
        const pedido = await prisma.pedidoCancion.update({
            where: { id },
            data: { estado }
        });
        // Actualizar contadores en EstadisticasCancion
        if (pedidoAnterior.titulo && pedidoAnterior.artista && pedidoAnterior.perfilArtistaId) {
            try {
                const estadoAnterior = pedidoAnterior.estado;
                const estadoNuevo = estado;
                const spotifyKey = pedidoAnterior.spotifyId || `manual_${pedidoAnterior.titulo}_${pedidoAnterior.artista}`;
                // Decrementar contador del estado anterior
                if (estadoAnterior === 'ACEPTADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalAceptados: { decrement: 1 } }
                    });
                }
                else if (estadoAnterior === 'RECHAZADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalRechazados: { decrement: 1 } }
                    });
                }
                // Incrementar contador del nuevo estado
                if (estadoNuevo === 'ACEPTADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalAceptados: { increment: 1 } }
                    });
                }
                else if (estadoNuevo === 'RECHAZADO') {
                    await prisma.estadisticasCancion.updateMany({
                        where: {
                            spotifyId: spotifyKey,
                            perfilArtistaId: pedidoAnterior.perfilArtistaId
                        },
                        data: { totalRechazados: { increment: 1 } }
                    });
                }
            }
            catch (error) {
                console.error("Error actualizando contadores de estadísticas:", error);
                // No fallamos la actualización si falla la estadística
            }
        }
        return pedido;
    }
}
exports.PrismaPedidoRepository = PrismaPedidoRepository;
