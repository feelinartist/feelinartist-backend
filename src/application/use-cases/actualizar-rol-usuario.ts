import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario } from '../../domain/entities/user';


import { LocalFileService } from '../../infrastructure/services/local-file-service';
import { QrService } from '../../infrastructure/services/qr-service';
import { configService } from '../../infrastructure/services/config-service';

export class ActualizarRolUsuarioCasoUso {
    private readonly localFileService: LocalFileService;
    private readonly qrService: QrService;

    constructor(private readonly repositorioUsuario: RepositorioUsuario) {
        this.localFileService = new LocalFileService();
        this.qrService = new QrService();
    }

    private async generarQrMapeado(
        usuarioId: string,
        username: string | null | undefined,
        datosPerfilArtista?: Record<string, unknown>
    ): Promise<Record<string, unknown> | undefined> {
        if (!username) {
            return datosPerfilArtista;
        }
        try {
            const frontendUrl = await configService.get('FRONTEND_URL', 'https://localhost:3000');
            const profileUrl = `${frontendUrl}/artist/${username}/music`;
            const qrBuffer = await this.qrService.generateQrCode(profileUrl);
            const qrBase64 = `data:image/png;base64,${qrBuffer.toString('base64')}`;
            const result = await this.localFileService.uploadBase64Image(qrBase64, usuarioId, 'music', 'qr');
            
            const updatedPerfil = datosPerfilArtista ? { ...datosPerfilArtista } : {};
            updatedPerfil.musicQR = result.url;
            return updatedPerfil;
        } catch (error) {
            console.error('Error generating/uploading QR code:', error);
            return datosPerfilArtista;
        }
    }

    private construirPerfilDiscoteca(datosDiscoteca: Record<string, unknown>): Record<string, unknown> {
        return {
            ciudad: datosDiscoteca.ciudad,
            pais: datosDiscoteca.pais,
            fechaFundacion: datosDiscoteca.fechaFundacion ? new Date(datosDiscoteca.fechaFundacion as string) : undefined,
            codigoTelefono: datosDiscoteca.codigoTelefono,
            numeroTelefono: datosDiscoteca.numeroTelefono,
            zonaHoraria: datosDiscoteca.zonaHoraria
        };
    }

    async ejecutar(correo: string, nombreRol: string, datosPerfilArtista?: Record<string, unknown>, datosPerfilPublico?: Record<string, unknown>, datosDiscoteca?: Record<string, unknown>, nombreUsuario?: string, nombre?: string): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorCorreo(correo);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        if (nombreUsuario && nombreUsuario !== usuario.nombreUsuario) {
            const existe = await this.repositorioUsuario.buscarPorNombreUsuario(nombreUsuario);
            if (existe && existe.id !== usuario.id) {
                throw new Error("El nombre de usuario ya está en uso.");
            }
        }

        let finalPerfilArtista = datosPerfilArtista;
        if (nombreRol === 'ARTISTA') {
            const username = nombreUsuario || usuario.nombreUsuario;
            finalPerfilArtista = await this.generarQrMapeado(usuario.id, username, datosPerfilArtista);
        }

        let finalRol = nombreRol;
        if (usuario.rol?.nombre === 'SUPER_ADMIN' || usuario.rol?.nombre === 'ADMIN') {
            finalRol = usuario.rol.nombre;
        }

        const updateData: Record<string, unknown> = {
            perfilArtista: finalPerfilArtista,
            perfilPublico: datosPerfilPublico,
            nombreUsuario: nombreUsuario,
            nombre: nombre
        };

        if (finalRol !== usuario.rol?.nombre) {
            updateData.rol = finalRol;
        }

        if (nombreRol === 'DISCOTECA' && datosDiscoteca) {
            updateData.perfilDiscoteca = this.construirPerfilDiscoteca(datosDiscoteca);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.repositorioUsuario.actualizar(usuario.id, updateData as any);
    }
}
