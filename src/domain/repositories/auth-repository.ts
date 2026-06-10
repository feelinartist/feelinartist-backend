import { Usuario } from '../entities/user';

export interface RefreshToken {
    id: string;
    token: string;
    usuarioId: string;
    expiraEn: Date;
    creadoEn: Date;
    revocado: boolean;
    usuario?: Usuario;
}

export interface RepositorioAuth {
    crearRefreshToken(usuarioId: string, token: string, expiraEn: Date): Promise<RefreshToken>;
    buscarRefreshTokenValido(token: string): Promise<RefreshToken | null>;
    revocarRefreshToken(id: string): Promise<void>;
    revocarRefreshTokenPorToken(token: string): Promise<void>;
}
