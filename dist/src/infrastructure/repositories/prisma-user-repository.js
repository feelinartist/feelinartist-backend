"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositorioUsuarioPrisma = void 0;
const prisma_1 = __importDefault(require("../database/prisma"));
class RepositorioUsuarioPrisma {
    async crear(datos) {
        const usuario = await prisma_1.default.usuario.create({
            data: {
                correo: datos.correo,
                nombre: datos.nombre,
                imagen: datos.imagen,
                nombreUsuario: datos.nombreUsuario,
                rol: datos.rol ? {
                    connect: { nombre: datos.rol }
                } : undefined,
            },
            include: { rol: true }
        });
        // Update creadoPor with the user's own ID after creation
        await prisma_1.default.usuario.update({
            where: { id: usuario.id },
            data: { creadoPor: usuario.id }
        });
        return this.mapToEntity(usuario);
    }
    async buscarPorCorreo(correo) {
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { correo },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true
            }
        });
        if (!usuario)
            return null;
        return this.mapToEntity(usuario);
    }
    async buscarPorId(id, usuarioSolicitanteId) {
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { id },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true,
                ...(usuarioSolicitanteId ? {
                    bloqueados: { where: { bloqueadoId: usuarioSolicitanteId } },
                    bloqueadoPor: { where: { bloqueadorId: usuarioSolicitanteId } }
                } : {})
            }
        });
        if (!usuario)
            return null;
        if (usuarioSolicitanteId) {
            if (usuario.bloqueados?.length > 0 || usuario.bloqueadoPor?.length > 0) {
                return null;
            }
        }
        return this.mapToEntity(usuario);
    }
    async buscarPorNombreUsuario(nombreUsuario, usuarioSolicitanteId) {
        const usuario = await prisma_1.default.usuario.findUnique({
            where: { nombreUsuario },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true,
                ...(usuarioSolicitanteId ? {
                    bloqueados: { where: { bloqueadoId: usuarioSolicitanteId } },
                    bloqueadoPor: { where: { bloqueadorId: usuarioSolicitanteId } }
                } : {})
            }
        });
        if (!usuario)
            return null;
        if (usuarioSolicitanteId) {
            if (usuario.bloqueados?.length > 0 || usuario.bloqueadoPor?.length > 0) {
                return null;
            }
        }
        return this.mapToEntity(usuario);
    }
    async actualizar(id, datos) {
        const datosActualizacion = {};
        if (datos.rol) {
            datosActualizacion.rol = {
                connect: { nombre: datos.rol }
            };
        }
        if (datos.nombre)
            datosActualizacion.nombre = datos.nombre;
        if (datos.imagen)
            datosActualizacion.imagen = datos.imagen;
        if (datos.nombreUsuario)
            datosActualizacion.nombreUsuario = datos.nombreUsuario;
        if (datos.ultimoCambioNombreUsuario)
            datosActualizacion.ultimoCambioNombreUsuario = datos.ultimoCambioNombreUsuario;
        if (datos.ultimoCambioNombre)
            datosActualizacion.ultimoCambioNombre = datos.ultimoCambioNombre;
        if (datos.estadoCuenta)
            datosActualizacion.estadoCuenta = datos.estadoCuenta;
        if (datos.fechaEliminacionProgramada)
            datosActualizacion.fechaEliminacionProgramada = datos.fechaEliminacionProgramada;
        if (datos.perfilCompletadoReconocido !== undefined)
            datosActualizacion.perfilCompletadoReconocido = datos.perfilCompletadoReconocido;
        // Audit field: track who is updating
        datosActualizacion.actualizadoPor = id;
        if (datos.perfilArtista) {
            const { redesSociales, metodosDonacion, galeria, imagenQR, nombreQR, urlPago, ...perfilArtistaData } = datos.perfilArtista;
            // Explicitly handle lugaresConocidos to avoid spread loss
            const nestedUpdate = {
                ...perfilArtistaData,
                lugaresConocidos: perfilArtistaData.lugaresConocidos,
                actualizadoPor: id // Audit: track who is updating
            };
            // Handle imagenQR, nombreQR, and urlPago at PerfilArtista level
            // Delete old QR image from Cloudinary if it's being changed
            if (imagenQR !== undefined) {
                // Get existing QR image
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existingProfile = await prisma_1.default.perfilArtista.findUnique({
                    where: { usuarioId: id },
                    select: { imagenQR: true }
                });
                // If there's an existing QR image and it's different from the new one, delete it from Cloudinary
                if (existingProfile?.imagenQR && existingProfile.imagenQR !== imagenQR) {
                    const publicId = this.extractPublicIdFromUrl(existingProfile.imagenQR);
                    if (publicId) {
                        try {
                            const { CloudinaryService } = await Promise.resolve().then(() => __importStar(require('../../infrastructure/services/cloudinary-service')));
                            const cloudinaryService = new CloudinaryService();
                            await cloudinaryService.deleteImage(publicId);
                        }
                        catch (error) {
                            console.error('Error deleting QR image from Cloudinary:', error);
                            // Continue with update even if Cloudinary deletion fails
                        }
                    }
                }
                nestedUpdate.imagenQR = imagenQR;
            }
            if (nombreQR !== undefined)
                nestedUpdate.nombreQR = nombreQR;
            if (urlPago !== undefined)
                nestedUpdate.urlPago = urlPago;
            // Handle legacy field mapping if necessary
            if (imagenQR !== undefined)
                nestedUpdate.codigoQR = imagenQR;
            // Handle Nested Relations
            // Note: We use deleteMany/create approach for simplicity as requested by "paso a paso" wizard nature
            if (redesSociales && Array.isArray(redesSociales)) {
                nestedUpdate.redesSociales = {
                    deleteMany: {},
                    create: redesSociales.map((r) => {
                        // Logic to handle phone number storage in 'nombreUsuario' if that's how we store it
                        // Or ensure frontend sends 'nombreUsuario' for whatsapp too.
                        // Assuming schema only has nombreUsuario:
                        let finalUsuario = r.nombreUsuario;
                        if (!finalUsuario && (r.codigoTelefono || r.numeroTelefono)) {
                            finalUsuario = `${r.codigoTelefono || ''}${r.numeroTelefono || ''}`.trim();
                        }
                        return {
                            redSocialId: r.redSocialId,
                            nombreUsuario: finalUsuario || '',
                            creadoPor: id // Audit: track who created this
                        };
                    })
                };
            }
            if (metodosDonacion && Array.isArray(metodosDonacion)) {
                nestedUpdate.metodosDonacion = {
                    deleteMany: {},
                    create: metodosDonacion.map((m) => ({
                        metodoDonacionId: m.metodoDonacionId,
                        numeroCuenta: m.numeroCuenta || m.identificador || m.numeroTelefono || '',
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }
            if (galeria && Array.isArray(galeria)) {
                // Get existing gallery images to delete from Cloudinary
                const existingGallery = await prisma_1.default.galeriaArtista.findMany({
                    where: { perfilArtistaId: (await prisma_1.default.perfilArtista.findUnique({ where: { usuarioId: id } }))?.id },
                    select: { urlImagen: true }
                });
                // Extract publicIds from Cloudinary URLs and delete from Cloudinary
                if (existingGallery.length > 0) {
                    const { CloudinaryService } = await Promise.resolve().then(() => __importStar(require('../../infrastructure/services/cloudinary-service')));
                    const cloudinaryService = new CloudinaryService();
                    const publicIds = existingGallery
                        .map(img => this.extractPublicIdFromUrl(img.urlImagen))
                        .filter(id => id !== null);
                    if (publicIds.length > 0) {
                        try {
                            await cloudinaryService.deleteImages(publicIds);
                        }
                        catch (error) {
                            console.error('Error deleting images from Cloudinary:', error);
                            // Continue with database deletion even if Cloudinary deletion fails
                        }
                    }
                }
                nestedUpdate.galeria = {
                    deleteMany: {},
                    create: galeria.map((item) => ({
                        urlImagen: typeof item === 'string' ? item : item.urlImagen,
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }
            // Prepare relations for CREATE (clean insert)
            const createRelations = {};
            if (redesSociales && Array.isArray(redesSociales)) {
                createRelations.redesSociales = {
                    create: redesSociales.map((r) => {
                        let finalUsuario = r.nombreUsuario;
                        if (!finalUsuario && (r.codigoTelefono || r.numeroTelefono)) {
                            finalUsuario = `${r.codigoTelefono || ''}${r.numeroTelefono || ''}`.trim();
                        }
                        return {
                            redSocialId: r.redSocialId,
                            nombreUsuario: finalUsuario || '',
                            creadoPor: id // Audit: track who created this
                        };
                    })
                };
            }
            if (metodosDonacion && Array.isArray(metodosDonacion)) {
                createRelations.metodosDonacion = {
                    create: metodosDonacion.map((m) => ({
                        metodoDonacionId: m.metodoDonacionId,
                        numeroCuenta: m.numeroCuenta || m.identificador || m.numeroTelefono || '',
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }
            if (galeria && Array.isArray(galeria)) {
                createRelations.galeria = {
                    create: galeria.map((item) => ({
                        urlImagen: typeof item === 'string' ? item : item.urlImagen,
                        creadoPor: id // Audit: track who created this
                    }))
                };
            }
            // Ensure we have defaults for required fields if creating a new profile
            const createData = {
                categoria: 'SOLISTA',
                biografia: '',
                tarifaPorHora: 0,
                moneda: 'PEN',
                zonaHoraria: 'America/Lima',
                ...perfilArtistaData,
                lugaresConocidos: perfilArtistaData.lugaresConocidos, // Explicit assignment
                creadoPor: id, // Audit: track who created this profile
                ...createRelations
            };
            datosActualizacion.perfilArtista = {
                upsert: {
                    create: createData,
                    update: nestedUpdate
                }
            };
        }
        if (datos.perfilPublico) {
            datosActualizacion.perfilPublico = {
                upsert: {
                    create: { ...datos.perfilPublico, creadoPor: id },
                    update: { ...datos.perfilPublico, actualizadoPor: id }
                }
            };
        }
        if (datos.perfilDiscoteca) {
            datosActualizacion.perfilDiscoteca = {
                upsert: {
                    create: { ...datos.perfilDiscoteca, creadoPor: id },
                    update: { ...datos.perfilDiscoteca, actualizadoPor: id }
                }
            };
        }
        const usuario = await prisma_1.default.usuario.update({
            where: { id },
            data: datosActualizacion,
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true
            }
        });
        return this.mapToEntity(usuario);
    }
    async bloquear(bloqueadorId, bloqueadoId) {
        await prisma_1.default.bloqueo.create({
            data: {
                bloqueadorId,
                bloqueadoId,
                creadoPor: bloqueadorId // Audit: the blocker is the creator
            }
        });
    }
    async desbloquear(bloqueadorId, bloqueadoId) {
        await prisma_1.default.bloqueo.deleteMany({
            where: {
                bloqueadorId,
                bloqueadoId
            }
        });
    }
    async obtenerBloqueados(bloqueadorId) {
        const bloqueos = await prisma_1.default.bloqueo.findMany({
            where: { bloqueadorId },
            include: {
                bloqueado: {
                    include: {
                        rol: true,
                        perfilArtista: {
                            include: {
                                redesSociales: { include: { redSocial: true } },
                                metodosDonacion: { include: { metodoDonacion: true } },
                                galeria: true
                            }
                        },
                        perfilPublico: true,
                        perfilDiscoteca: true
                    }
                }
            }
        });
        return bloqueos.map(b => this.mapToEntity(b.bloqueado));
    }
    async buscarArtistas(filtro) {
        const { termino, paisId, usuarioSolicitanteId } = filtro;
        const usuarios = await prisma_1.default.usuario.findMany({
            where: {
                rol: { nombre: 'ARTISTA' },
                estadoCuenta: 'ACTIVO',
                // Exclude users who blocked the requester or are blocked by the requester
                ...(usuarioSolicitanteId ? {
                    bloqueados: { none: { bloqueadoId: usuarioSolicitanteId } },
                    bloqueadoPor: { none: { bloqueadorId: usuarioSolicitanteId } },
                } : {}),
                AND: [
                    termino ? {
                        OR: [
                            { nombre: { contains: termino } },
                            { nombreUsuario: { contains: termino } }
                        ]
                    } : {},
                    paisId ? {
                        OR: [
                            { perfilArtista: { pais: { contains: paisId } } },
                            { perfilDiscoteca: { pais: { contains: paisId } } }
                        ]
                    } : {}
                ]
            },
            include: {
                rol: true,
                perfilArtista: {
                    include: {
                        redesSociales: { include: { redSocial: true } },
                        metodosDonacion: { include: { metodoDonacion: true } },
                        galeria: true
                    }
                },
                perfilPublico: true,
                perfilDiscoteca: true
            }
        });
        return usuarios.map(u => this.mapToEntity(u));
    }
    // Removed obtenerPaises and obtenerCiudades as tables are gone
    async obtenerPaises() { return []; }
    async obtenerCiudades(_paisId) { return []; }
    async listarUsuarios(page = 1, limit = 20, termino) {
        const skip = (page - 1) * limit;
        const where = termino ? {
            OR: [
                { nombre: { contains: termino } },
                { correo: { contains: termino } },
                { nombreUsuario: { contains: termino } }
            ]
        } : {};
        const [usuarios, total] = await Promise.all([
            prisma_1.default.usuario.findMany({
                where,
                skip,
                take: limit,
                include: {
                    rol: true,
                    perfilArtista: {
                        include: {
                            redesSociales: { include: { redSocial: true } },
                            metodosDonacion: { include: { metodoDonacion: true } },
                            galeria: true,
                            eventos: { where: { activo: true } }
                        }
                    },
                    perfilPublico: true,
                    perfilDiscoteca: true
                },
                orderBy: { creadoEn: 'desc' }
            }),
            prisma_1.default.usuario.count({ where })
        ]);
        return {
            usuarios: usuarios.map(u => this.mapToEntity(u)),
            total
        };
    }
    async eliminarPermanente(id) {
        await prisma_1.default.usuario.delete({
            where: { id }
        });
    }
    /**
     * Extract Cloudinary publicId from a Cloudinary URL
     * Example: https://res.cloudinary.com/djfkyim7a/image/upload/v1234567890/feelin/users/abc-123/gallery/image_123.jpg
     * Returns: feelin/users/abc-123/gallery/image_123
     */
    extractPublicIdFromUrl(url) {
        try {
            // Match Cloudinary URL pattern
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
            return match ? match[1] : null;
        }
        catch (error) {
            console.error('Error extracting publicId from URL:', url, error);
            return null;
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapToEntity(prismaUser) {
        return {
            id: prismaUser.id,
            correo: prismaUser.correo,
            nombre: prismaUser.nombre,
            imagen: prismaUser.imagen,
            nombreUsuario: prismaUser.nombreUsuario,
            rol: prismaUser.rol ? { id: prismaUser.rol.id, nombre: prismaUser.rol.nombre } : null,
            perfilArtista: prismaUser.perfilArtista ? {
                ...prismaUser.perfilArtista,
                // Ensure dates/decimals are handled if needed, but for now spread is okay
            } : undefined,
            perfilPublico: prismaUser.perfilPublico ? {
                ...prismaUser.perfilPublico
            } : undefined,
            perfilDiscoteca: prismaUser.perfilDiscoteca ? {
                ...prismaUser.perfilDiscoteca
            } : undefined,
            creadoEn: prismaUser.creadoEn,
            actualizadoEn: prismaUser.actualizadoEn,
            ultimoCambioNombreUsuario: prismaUser.ultimoCambioNombreUsuario,
            ultimoCambioNombre: prismaUser.ultimoCambioNombre,
            estadoCuenta: prismaUser.estadoCuenta,
            fechaEliminacionProgramada: prismaUser.fechaEliminacionProgramada,
            perfilCompletadoReconocido: prismaUser.perfilCompletadoReconocido,
        };
    }
}
exports.RepositorioUsuarioPrisma = RepositorioUsuarioPrisma;
