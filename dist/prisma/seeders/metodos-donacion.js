"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metodosDonacionData = void 0;
exports.seedMetodosDonacion = seedMetodosDonacion;
exports.metodosDonacionData = [
    { nombre: 'Yape', icono: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Yape_text_app_icon.png/240px-Yape_text_app_icon.png' },
    { nombre: 'Plin', icono: 'https://vectorseek.com/wp-content/uploads/2023/09/Plin-Logo-Vector.svg-.png' },
    { nombre: 'PayPal', icono: 'https://cdn.simpleicons.org/paypal/00457C' },
    { nombre: 'Transferencia BCP', icono: 'https://cdn.simpleicons.org/chase/117ACA' }, // Placeholder/Generic bank
    { nombre: 'Transferencia Interbank', icono: 'https://cdn.simpleicons.org/chase/00965E' }, // Placeholder
    { nombre: 'Transferencia BBVA', icono: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/BBVA_2019.svg/640px-BBVA_2019.svg.png' },
    { nombre: 'Transferencia Scotiabank', icono: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Scotiabank-logo-red.png' },
    { nombre: 'Binance Pay', icono: 'https://cdn.simpleicons.org/binance/F0B90B' },
];
async function seedMetodosDonacion(prisma) {
    console.log('🌱 Seeding Metodos Donacion...');
    for (const metodo of exports.metodosDonacionData) {
        await prisma.metodoDonacion.upsert({
            where: { nombre: metodo.nombre },
            update: {
                icono: metodo.icono
            },
            create: {
                nombre: metodo.nombre,
                icono: metodo.icono,
                activo: true
            }
        });
    }
    console.log('✅ Metodos Donacion seeded successfully');
}
