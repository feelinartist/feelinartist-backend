"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const redes_sociales_1 = require("./seeders/redes-sociales");
const metodos_donacion_1 = require("./seeders/metodos-donacion");
const prisma = new client_1.PrismaClient();
async function main() {
    const roles = [
        { nombre: 'SUPER_ADMIN' },
        { nombre: 'ADMIN' },
        { nombre: 'ARTISTA' },
        { nombre: 'PUBLICO' },
        { nombre: 'DISCOTECA' },
    ];
    console.log('Start seeding roles...');
    for (const rol of roles) {
        const rolCreado = await prisma.rol.upsert({
            where: { nombre: rol.nombre },
            update: {},
            create: {
                nombre: rol.nombre,
            },
        });
        console.log(`Created role: ${rolCreado.nombre} with ID: ${rolCreado.id}`);
    }
    // Seed Super Admin
    const superAdminEmail = 'feelinappartist@gmail.com';
    const superAdminRole = await prisma.rol.findUnique({ where: { nombre: 'SUPER_ADMIN' } });
    if (superAdminRole) {
        const superAdmin = await prisma.usuario.upsert({
            where: { correo: superAdminEmail },
            update: {
                rol: {
                    connect: { id: superAdminRole.id }
                }
            },
            create: {
                correo: superAdminEmail,
                rol: {
                    connect: { id: superAdminRole.id }
                }
            },
        });
        console.log(`Created Super Admin: ${superAdmin.correo}`);
    }
    await (0, redes_sociales_1.seedRedesSociales)(prisma);
    await (0, metodos_donacion_1.seedMetodosDonacion)(prisma);
    console.log('Seeding finished.');
}
main()
    .catch(async (e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
