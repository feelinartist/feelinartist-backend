import { PrismaClient } from '@prisma/client';
import { seedRedesSociales } from './seeders/redes-sociales';
import { seedMetodosDonacion } from './seeders/metodos-donacion';

const prisma = new PrismaClient();

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

    await seedRedesSociales(prisma);
    await seedMetodosDonacion(prisma);

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
