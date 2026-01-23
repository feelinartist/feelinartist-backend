"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositorioConfigPrisma = void 0;
const client_1 = require("@prisma/client");
class RepositorioConfigPrisma {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    // Redes Sociales
    async listarRedesSociales() {
        return this.prisma.redSocial.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        });
    }
    async crearRedSocial(data) {
        return this.prisma.redSocial.create({ data });
    }
    async actualizarRedSocial(id, data) {
        return this.prisma.redSocial.update({
            where: { id },
            data
        });
    }
    async eliminarRedSocial(id) {
        // Soft delete
        return this.prisma.redSocial.update({
            where: { id },
            data: { activo: false }
        });
    }
    // Metodos Donacion
    async listarMetodosDonacion() {
        return this.prisma.metodoDonacion.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' }
        });
    }
    async crearMetodoDonacion(data) {
        return this.prisma.metodoDonacion.create({ data });
    }
    async actualizarMetodoDonacion(id, data) {
        return this.prisma.metodoDonacion.update({
            where: { id },
            data
        });
    }
    async eliminarMetodoDonacion(id) {
        // Soft delete
        return this.prisma.metodoDonacion.update({
            where: { id },
            data: { activo: false }
        });
    }
    // Roles
    async listarRoles() {
        return this.prisma.rol.findMany({
            orderBy: { nombre: 'asc' }
        }).then(roles => roles.map(r => ({ id: r.id, nombre: r.nombre })));
    }
}
exports.RepositorioConfigPrisma = RepositorioConfigPrisma;
