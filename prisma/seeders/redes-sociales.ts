import { PrismaClient } from '@prisma/client';

export const redesSocialesData = [
    { nombre: 'Facebook', urlBase: 'https://facebook.com/', icono: 'https://cdn.simpleicons.org/facebook/1877F2' },
    { nombre: 'YouTube', urlBase: 'https://youtube.com/@', icono: 'https://cdn.simpleicons.org/youtube/FF0000' },
    { nombre: 'Kick', urlBase: 'https://kick.com/', icono: 'https://cdn.simpleicons.org/kick/05FF00' },
    { nombre: 'Twitch', urlBase: 'https://twitch.tv/', icono: 'https://cdn.simpleicons.org/twitch/9146FF' },
    { nombre: 'Twitter (X)', urlBase: 'https://x.com/', icono: 'https://cdn.simpleicons.org/x/000000' },
    { nombre: 'Spotify', urlBase: 'https://open.spotify.com/artist/', icono: 'https://cdn.simpleicons.org/spotify/1DB954' },
    { nombre: 'SoundCloud', urlBase: 'https://soundcloud.com/', icono: 'https://cdn.simpleicons.org/soundcloud/FF3300' },
    { nombre: 'Instagram', urlBase: 'https://instagram.com/', icono: 'https://cdn.simpleicons.org/instagram/E4405F' },
    { nombre: 'TikTok', urlBase: 'https://tiktok.com/@', icono: 'https://cdn.simpleicons.org/tiktok/FFFFFF' },
];

export async function seedRedesSociales(prisma: PrismaClient) {
    console.log('🌱 Seeding Redes Sociales...');

    for (const red of redesSocialesData) {
        await prisma.redSocial.upsert({
            where: { nombre: red.nombre },
            update: {
                urlBase: red.urlBase,
                icono: red.icono
            },
            create: {
                nombre: red.nombre,
                urlBase: red.urlBase,
                icono: red.icono,
                activo: true
            }
        });
    }

    console.log('✅ Redes Sociales seeded successfully');
}
