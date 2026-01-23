import { RepositorioUsuario } from '../../domain/repositories/user-repository';
import { Usuario } from '../../domain/entities/user';

export class ObtenerUsuarioPorCorreoCasoUso {
    constructor(private repositorioUsuario: RepositorioUsuario) { }

    async ejecutar(correo: string): Promise<Usuario | null> {
        return this.repositorioUsuario.buscarPorCorreo(correo);
    }
}
