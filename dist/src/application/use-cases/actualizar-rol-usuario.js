"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActualizarRolUsuarioCasoUso = void 0;
const cloudinary_service_1 = require("../../infrastructure/services/cloudinary-service");
const qr_service_1 = require("../../infrastructure/services/qr-service");
const config_service_1 = require("../../infrastructure/services/config-service");
class ActualizarRolUsuarioCasoUso {
    constructor(repositorioUsuario) {
        this.repositorioUsuario = repositorioUsuario;
        this.cloudinaryService = new cloudinary_service_1.CloudinaryService();
        this.qrService = new qr_service_1.QrService();
    }
    async ejecutar(correo, nombreRol, datosPerfilArtista, datosPerfilPublico, datosDiscoteca, nombreUsuario, nombre) {
        const usuario = await this.repositorioUsuario.buscarPorCorreo(correo);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        if (nombreRol === 'ARTISTA') {
            try {
                const username = nombreUsuario || usuario.nombreUsuario;
                if (username) {
                    const frontendUrl = await config_service_1.configService.get('FRONTEND_URL', 'http://localhost:3000');
                    const profileUrl = `${frontendUrl}/artist/${username}/music`;
                    const qrBuffer = await this.qrService.generateQrCode(profileUrl);
                    // Use organized folder structure: feelin/users/{userId}/profile
                    const folder = this.cloudinaryService.getUserFolder(usuario.id, 'profile');
                    const qrUrl = await this.cloudinaryService.uploadImage(qrBuffer, folder);
                    if (!datosPerfilArtista)
                        datosPerfilArtista = {};
                    datosPerfilArtista.codigoQR = qrUrl;
                }
            }
            catch (error) {
                console.error('Error generating/uploading QR code:', error);
                // Continue without QR if it fails to avoid blocking registration on external service failure
            }
        }
        const updateData = {
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
                fechaFundacion: datosDiscoteca.fechaFundacion ? new Date(datosDiscoteca.fechaFundacion) : undefined,
                codigoTelefono: datosDiscoteca.codigoTelefono,
                numeroTelefono: datosDiscoteca.numeroTelefono,
                zonaHoraria: datosDiscoteca.zonaHoraria
            };
        }
        else {
            updateData.perfilDiscoteca = undefined; // Or keep existing if not updating to DISCOTECA
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.repositorioUsuario.actualizar(usuario.id, updateData);
    }
}
exports.ActualizarRolUsuarioCasoUso = ActualizarRolUsuarioCasoUso;
