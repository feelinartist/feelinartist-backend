import { Request, Response } from 'express';
import { CrearUsuarioCasoUso } from '../../application/use-cases/crear-usuario';
import { RepositorioUsuarioPrisma } from '../../infrastructure/repositories/prisma-user-repository';

const repositorioUsuario = new RepositorioUsuarioPrisma();
const crearUsuarioCasoUso = new CrearUsuarioCasoUso(repositorioUsuario);

export class ControladorAutenticacion {
    async iniciarSesion(req: Request, res: Response) {
        try {
            const { correo, nombre, imagen } = req.body;

            if (!correo) {
                return res.status(400).json({ message: 'El correo es requerido' });
            }

            // In a real scenario, we would verify the Google token here.
            // For now, we trust the NextAuth session data sent from frontend.

            const usuario = await crearUsuarioCasoUso.ejecutar({ correo, nombre, imagen });

            return res.status(200).json(usuario);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
