import { Request, Response } from 'express';
import { CrearUsuarioCasoUso } from '../../application/use-cases/crear-usuario';
import { RepositorioUsuarioPrisma } from '../../infrastructure/repositories/prisma-user-repository';
import { generateToken } from '../../middleware/auth';

const repositorioUsuario = new RepositorioUsuarioPrisma();
const crearUsuarioCasoUso = new CrearUsuarioCasoUso(repositorioUsuario);

export class ControladorAutenticacion {
    async iniciarSesion(req: Request, res: Response) {
        try {
            const { correo } = req.body;

            if (!correo) {
                return res.status(400).json({ message: 'El correo es requerido' });
            }

            const usuarioExistente = await repositorioUsuario.buscarPorCorreo(correo);
            if (!usuarioExistente) {
                return res.status(404).json({ message: 'Usuario no registrado' });
            }

            const { nombre, imagen, zonaHoraria } = req.body;
            const usuario = await crearUsuarioCasoUso.ejecutar({ correo, nombre, imagen, zonaHoraria });

            // Generate a real JWT for the frontend to use in subsequent API calls
            const token = generateToken({
                id: usuario.id,
                email: usuario.correo,
                rol: usuario.rol?.nombre
            });

            return res.status(200).json({ ...usuario, token });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }

    async registrar(req: Request, res: Response) {
        try {
            const { correo, nombre, imagen, zonaHoraria } = req.body;

            if (!correo) {
                return res.status(400).json({ message: 'El correo es requerido' });
            }
            if (!nombre) {
                return res.status(400).json({ message: 'El nombre es requerido' });
            }
            if (!imagen) {
                return res.status(400).json({ message: 'La imagen es requerida' });
            }
            if (!zonaHoraria) {
                return res.status(400).json({ message: 'La zona horaria es requerida' });
            }

            const usuarioExistente = await repositorioUsuario.buscarPorCorreo(correo);
            if (usuarioExistente) {
                return res.status(400).json({ message: 'El usuario ya está registrado' });
            }

            const usuario = await crearUsuarioCasoUso.ejecutar({ correo, nombre, imagen, zonaHoraria });

            const token = generateToken({
                id: usuario.id,
                email: usuario.correo,
                rol: usuario.rol?.nombre
            });

            return res.status(201).json({ ...usuario, token });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
