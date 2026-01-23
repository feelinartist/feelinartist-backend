"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaEventoRepository = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PrismaEventoRepository {
    async crearEvento(userIdOrArtistaId, titulo, descripcion, latitud, longitud) {
        // Resolve PerfilArtista ID
        const perfil = await prisma.perfilArtista.findFirst({
            where: {
                OR: [
                    { id: userIdOrArtistaId },
                    { usuarioId: userIdOrArtistaId }
                ]
            }
        });
        if (!perfil)
            throw new Error("Perfil de artista no encontrado");
        const artistaId = perfil.id;
        // Check if there is already an active event via Prisma directly to fail fast
        const eventoActivo = await prisma.evento.findFirst({
            where: {
                perfilArtistaId: artistaId,
                activo: true
            }
        });
        if (eventoActivo) {
            throw new Error("Ya tienes un evento en curso. Finalízalo antes de iniciar uno nuevo.");
        }
        return await prisma.$transaction(async (tx) => {
            // Activate QR for requests
            await tx.perfilArtista.update({
                where: { id: artistaId },
                data: { pedidosActivos: true }
            });
            // Create the new event
            return await tx.evento.create({
                data: {
                    perfilArtistaId: artistaId,
                    titulo,
                    descripcion,
                    latitud,
                    longitud,
                    activo: true,
                    horaInicio: new Date(),
                    creadoPor: perfil.usuarioId,
                    actualizadoPor: perfil.usuarioId
                },
            });
        });
    }
    async finalizarEvento(eventoId) {
        return await prisma.$transaction(async (tx) => {
            // First find the event to get the artist profile and user ID
            const eventoExistente = await tx.evento.findUnique({
                where: { id: eventoId },
                include: { perfilArtista: true }
            });
            if (!eventoExistente) {
                throw new Error("Evento no encontrado");
            }
            const usuarioId = eventoExistente.perfilArtista?.usuarioId;
            const evento = await tx.evento.update({
                where: { id: eventoId },
                data: {
                    activo: false,
                    horaFin: new Date(),
                    actualizadoPor: usuarioId
                },
            });
            if (evento.perfilArtistaId) {
                await tx.perfilArtista.update({
                    where: { id: evento.perfilArtistaId },
                    data: { pedidosActivos: false }
                });
            }
            // Clean up: Delete unhandled requests
            await tx.pedidoCancion.deleteMany({
                where: {
                    eventoId,
                    estado: "PENDIENTE"
                }
            });
            return evento;
        });
    }
    async obtenerEventoActivo(userIdOrArtistaId) {
        const perfil = await prisma.perfilArtista.findFirst({
            where: {
                OR: [
                    { id: userIdOrArtistaId },
                    { usuarioId: userIdOrArtistaId }
                ]
            }
        });
        if (!perfil)
            return null;
        const artistaId = perfil.id;
        return await prisma.evento.findFirst({
            where: {
                perfilArtistaId: artistaId,
                activo: true,
            },
            orderBy: {
                horaInicio: 'desc',
            },
        });
    }
    async togglePedidos(userIdOrArtistaId, activo) {
        const perfil = await prisma.perfilArtista.findFirst({
            where: {
                OR: [
                    { id: userIdOrArtistaId },
                    { usuarioId: userIdOrArtistaId }
                ]
            }
        });
        if (!perfil)
            throw new Error("Perfil de artista no encontrado");
        const artistaId = perfil.id;
        const updated = await prisma.perfilArtista.update({
            where: { id: artistaId },
            data: {
                pedidosActivos: activo,
            },
        });
        return {
            id: updated.id,
            pedidosActivos: updated.pedidosActivos
        };
    }
    async obtenerEventosPorArtista(perfilArtistaId) {
        return await prisma.evento.findMany({
            where: { perfilArtistaId },
            select: {
                id: true,
                titulo: true,
                horaInicio: true,
                horaFin: true,
                activo: true
            },
            orderBy: { horaInicio: 'desc' }
        });
    }
    async obtenerEventosPaginados(perfilArtistaId, page = 1, limit = 20, search) {
        const skip = (page - 1) * limit;
        const where = { perfilArtistaId };
        if (search) {
            where.titulo = {
                contains: search,
                mode: 'insensitive'
            };
        }
        const [eventos, total] = await Promise.all([
            prisma.evento.findMany({
                where,
                select: {
                    id: true,
                    titulo: true,
                    horaInicio: true,
                    horaFin: true,
                    activo: true
                },
                orderBy: { horaInicio: 'desc' },
                skip,
                take: limit
            }),
            prisma.evento.count({ where })
        ]);
        // Get statistics for each event
        const eventosConStats = await Promise.all(eventos.map(async (evento) => {
            const stats = await prisma.pedidoCancion.groupBy({
                by: ['estado'],
                where: { eventoId: evento.id },
                _count: true
            });
            const totalAceptados = stats.find(s => s.estado === 'ACEPTADO')?._count || 0;
            const totalRechazados = stats.find(s => s.estado === 'RECHAZADO')?._count || 0;
            const totalPedidos = totalAceptados + totalRechazados;
            const tasaAceptacion = totalPedidos > 0 ? Math.round((totalAceptados / totalPedidos) * 100) : 0;
            return {
                ...evento,
                totalPedidos,
                totalAceptados,
                totalRechazados,
                tasaAceptacion
            };
        }));
        return {
            eventos: eventosConStats,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }
}
exports.PrismaEventoRepository = PrismaEventoRepository;
