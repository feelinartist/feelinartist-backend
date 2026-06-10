import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario } from '../../domain/entities/user';
import { LocalFileService } from '../../infrastructure/services/local-file-service';
import { QrService } from '../../infrastructure/services/qr-service';
import { configService } from '../../infrastructure/services/config-service';

export interface ActualizarRolUsuarioRequest {
    correo: string;
    nombreRol: string;
    datosPerfilArtista?: Record<string, unknown>;
    datosPerfilPublico?: Record<string, unknown>;
    datosDiscoteca?: Record<string, unknown>;
    nombreUsuario?: string;
    nombre?: string;
    imagen?: string;
    zonaHoraria?: string;
    codigoTelefono?: string;
    numeroTelefono?: string;
    ciudad?: string;
    pais?: string;
    generosFavoritos?: string[];
}

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
            fechaFundacion: datosDiscoteca.fechaFundacion ? new Date(datosDiscoteca.fechaFundacion as string) : undefined
        };
    }

    private async validarNombreUsuario(nombreUsuario: string | undefined, usuarioId: string, currentUsername: string | null | undefined): Promise<void> {
        if (nombreUsuario && nombreUsuario !== currentUsername) {
            const existe = await this.repositorioUsuario.buscarPorNombreUsuario(nombreUsuario);
            if (existe && existe.id !== usuarioId) {
                throw new Error("El nombre de usuario ya está en uso.");
            }
        }
    }

    private async obtenerPerfilArtista(
        usuarioId: string,
        nombreUsuario: string | undefined,
        currentUsername: string | null | undefined,
        nombreRol: string,
        datosPerfilArtista?: Record<string, unknown>
    ): Promise<Record<string, unknown> | undefined> {
        if (nombreRol !== 'ARTISTA') {
            return undefined;
        }
        let cleanArtista = datosPerfilArtista;
        if (datosPerfilArtista) {
            const { ciudad: _c, pais: _p, codigoTelefono: _ct, numeroTelefono: _nt, zonaHoraria: _zh, ...rest } = datosPerfilArtista;
            cleanArtista = rest;
        }
        const username = nombreUsuario || currentUsername;
        return this.generarQrMapeado(usuarioId, username, cleanArtista);
    }

    private obtenerPerfilPublico(nombreRol: string, datosPerfilPublico?: Record<string, unknown>): Record<string, unknown> | undefined {
        if (nombreRol !== 'PUBLICO') {
            return undefined;
        }
        if (datosPerfilPublico) {
            const { ciudad: _c, pais: _p, codigoTelefono: _ct, numeroTelefono: _nt, zonaHoraria: _zh, ...cleanPublico } = datosPerfilPublico;
            return cleanPublico;
        }
        return {};
    }

    async ejecutar(req: ActualizarRolUsuarioRequest): Promise<Usuario> {
        const usuario = await this.repositorioUsuario.buscarPorCorreo(req.correo);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        await this.validarNombreUsuario(req.nombreUsuario, usuario.id, usuario.nombreUsuario);

        const finalPerfilArtista = await this.obtenerPerfilArtista(usuario.id, req.nombreUsuario, usuario.nombreUsuario, req.nombreRol, req.datosPerfilArtista);
        const finalPerfilPublico = this.obtenerPerfilPublico(req.nombreRol, req.datosPerfilPublico);

        let finalRol = req.nombreRol;
        if (usuario.rol?.nombre === 'SUPER_ADMIN' || usuario.rol?.nombre === 'ADMIN') {
            finalRol = usuario.rol.nombre;
        }

        const finalZonaHoraria = req.zonaHoraria || (req.datosDiscoteca?.zonaHoraria as string) || (req.datosPerfilArtista?.zonaHoraria as string) || (req.datosPerfilPublico?.zonaHoraria as string);
        const finalCodigoTelefono = req.codigoTelefono || (req.datosDiscoteca?.codigoTelefono as string) || (req.datosPerfilArtista?.codigoTelefono as string) || (req.datosPerfilPublico?.codigoTelefono as string);
        const finalNumeroTelefono = req.numeroTelefono || (req.datosDiscoteca?.numeroTelefono as string) || (req.datosPerfilArtista?.numeroTelefono as string) || (req.datosPerfilPublico?.numeroTelefono as string);
        const finalCiudad = req.ciudad || (req.datosDiscoteca?.ciudad as string) || (req.datosPerfilArtista?.ciudad as string) || (req.datosPerfilPublico?.ciudad as string);
        const finalPais = req.pais || (req.datosDiscoteca?.pais as string) || (req.datosPerfilArtista?.pais as string) || (req.datosPerfilPublico?.pais as string);

        const updateData: Record<string, unknown> = {
            perfilArtista: finalPerfilArtista,
            perfilPublico: finalPerfilPublico,
            nombreUsuario: req.nombreUsuario,
            nombre: req.nombre,
            imagen: req.imagen,
            zonaHoraria: finalZonaHoraria,
            codigoTelefono: finalCodigoTelefono,
            numeroTelefono: finalNumeroTelefono,
            ciudad: finalCiudad,
            pais: finalPais,
            generosFavoritos: req.generosFavoritos
        };

        if (finalRol !== usuario.rol?.nombre) {
            updateData.rol = finalRol;
        }

        if (req.nombreRol === 'DISCOTECA' && req.datosDiscoteca) {
            updateData.perfilDiscoteca = this.construirPerfilDiscoteca(req.datosDiscoteca);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.repositorioUsuario.actualizar(usuario.id, updateData as any);
    }
}
