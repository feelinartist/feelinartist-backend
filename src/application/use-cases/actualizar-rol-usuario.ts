import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario } from '../../domain/entities/user';


import { CloudinaryService } from '../../infrastructure/services/cloudinary-service';
import { QrService } from '../../infrastructure/services/qr-service';
import { configService } from '../../infrastructure/services/config-service';

export class ActualizarRolUsuarioCasoUso {
    private cloudinaryService: CloudinaryService;
    private qrService: QrService;

    constructor(private repositorioUsuario: RepositorioUsuario) {
        this.cloudinaryService = new CloudinaryService();
        this.qrService = new QrService();
    }

    async ejecutar(correo: string, nombreRol: string, datosPerfilArtista?: Record<string, unknown>, datosPerfilPublico?: Record<string, unknown>, datosDiscoteca?: Record<string, unknown>, nombreUsuario?: string, nombre?: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorCorreo(correo);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        if (nombreRol === 'ARTISTA') {
            try {
                const username = nombreUsuario || usuario.nombreUsuario;
                if (username) {
                    const frontendUrl = await configService.get('FRONTEND_URL', 'http://localhost:3000');
                    const profileUrl = `${frontendUrl}/artist/${username}/music`;
                    const qrBuffer = await this.qrService.generateQrCode(profileUrl);

                    // Use organized folder structure: feelin/users/{userId}/profile
                    const folder = this.cloudinaryService.getUserFolder(usuario.id, 'profile');
                    const qrUrl = await this.cloudinaryService.uploadImage(qrBuffer, folder);

                    if (!datosPerfilArtista) datosPerfilArtista = {};
                    datosPerfilArtista.codigoQR = qrUrl;
                }
            } catch (error) {
                console.error('Error generating/uploading QR code:', error);
                // Continue without QR if it fails to avoid blocking registration on external service failure
            }
        }

        const updateData: Record<string, unknown> = {
            rol: nombreRol,
            perfilArtista: datosPerfilArtista,
            perfilPublico: datosPerfilPublico,
            nombreUsuario: nombreUsuario,
            nombre: nombre
        };

        if (nombreRol === 'DISCOTECA' && datosDiscoteca) {
            updateData.perfilDiscoteca = {
                ciudad: datosDiscoteca.ciudad,
                pais: datosDiscoteca.pais,
                fechaFundacion: datosDiscoteca.fechaFundacion ? new Date(datosDiscoteca.fechaFundacion as string) : undefined,
                codigoTelefono: datosDiscoteca.codigoTelefono,
                numeroTelefono: datosDiscoteca.numeroTelefono,
                zonaHoraria: datosDiscoteca.zonaHoraria
            };
        } else {
            updateData.perfilDiscoteca = undefined; // Or keep existing if not updating to DISCOTECA
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.repositorioUsuario.actualizar(usuario.id, updateData as any);
    }
}
