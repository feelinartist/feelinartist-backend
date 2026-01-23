"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControladorUsuario = void 0;
const actualizar_rol_usuario_1 = require("../../application/use-cases/actualizar-rol-usuario");
const prisma_user_repository_1 = require("../../infrastructure/repositories/prisma-user-repository");
const verificar_disponibilidad_usuario_1 = require("../../application/use-cases/verificar-disponibilidad-usuario");
const actualizar_usuario_1 = require("../../application/use-cases/actualizar-usuario");
const gestion_cuenta_1 = require("../../application/use-cases/gestion-cuenta");
const bloquear_usuario_1 = require("../../application/use-cases/bloquear-usuario");
const buscar_artistas_1 = require("../../application/use-cases/buscar-artistas");
const migrar_rol_usuario_1 = require("../../application/use-cases/migrar-rol-usuario");
const repositorioUsuario = new prisma_user_repository_1.RepositorioUsuarioPrisma();
const actualizarRolUsuarioCasoUso = new actualizar_rol_usuario_1.ActualizarRolUsuarioCasoUso(repositorioUsuario);
const verificarDisponibilidadUsuarioCasoUso = new verificar_disponibilidad_usuario_1.VerificarDisponibilidadUsuarioCasoUso(repositorioUsuario);
const actualizarUsuarioCasoUso = new actualizar_usuario_1.ActualizarUsuarioCasoUso(repositorioUsuario);
const gestionCuentaCasoUso = new gestion_cuenta_1.GestionCuentaCasoUso(repositorioUsuario);
const bloquearUsuarioCasoUso = new bloquear_usuario_1.BloquearUsuarioCasoUso(repositorioUsuario);
const buscarArtistasCasoUso = new buscar_artistas_1.BuscarArtistasCasoUso(repositorioUsuario);
const migrarRolUsuarioCasoUso = new migrar_rol_usuario_1.MigrarRolUsuarioCasoUso(repositorioUsuario);
class ControladorUsuario {
    // ... existing methods ...
    async listarUsuarios(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const termino = req.query.termino;
            const result = await repositorioUsuario.listarUsuarios(page, limit, termino);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async deshabilitarCuenta(req, res) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.deshabilitarCuenta(usuarioId);
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async eliminarCuenta(req, res) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.programarEliminacion(usuarioId);
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async reactivarCuenta(req, res) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.reactivarCuenta(usuarioId);
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async banearUsuario(req, res) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await gestionCuentaCasoUso.banearUsuario(usuarioId);
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async eliminarPermanente(req, res) {
        try {
            const { usuarioId } = req.body;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            await gestionCuentaCasoUso.eliminarUsuarioPermanente(usuarioId);
            return res.status(200).json({ message: 'Usuario eliminado permanentemente' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async bloquearUsuario(req, res) {
        try {
            const { bloqueadorId, bloqueadoId } = req.body;
            if (!bloqueadorId || !bloqueadoId)
                return res.status(400).json({ message: 'IDs son requeridos' });
            await bloquearUsuarioCasoUso.bloquear(bloqueadorId, bloqueadoId);
            return res.status(200).json({ message: 'Usuario bloqueado' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message || 'Error interno del servidor' });
        }
    }
    async desbloquearUsuario(req, res) {
        try {
            const { bloqueadorId, bloqueadoId } = req.body;
            if (!bloqueadorId || !bloqueadoId)
                return res.status(400).json({ message: 'IDs son requeridos' });
            await bloquearUsuarioCasoUso.desbloquear(bloqueadorId, bloqueadoId);
            return res.status(200).json({ message: 'Usuario desbloqueado' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async obtenerBloqueados(req, res) {
        try {
            const { bloqueadorId } = req.params;
            if (!bloqueadorId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            const bloqueados = await bloquearUsuarioCasoUso.obtenerBloqueados(bloqueadorId);
            return res.status(200).json(bloqueados);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async buscarArtistas(req, res) {
        try {
            const { termino, paisId, usuarioSolicitanteId } = req.query;
            const artistas = await buscarArtistasCasoUso.ejecutar({
                termino: termino,
                paisId: paisId,
                usuarioSolicitanteId: usuarioSolicitanteId
            });
            return res.status(200).json(artistas);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async migrarRol(req, res) {
        try {
            const { usuarioId, nuevoRol, datosPerfil } = req.body;
            if (!usuarioId || !nuevoRol)
                return res.status(400).json({ message: 'ID de usuario y nuevo rol son requeridos' });
            const usuario = await migrarRolUsuarioCasoUso.ejecutar(usuarioId, nuevoRol, datosPerfil || {});
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(400).json({ message: error.message || 'Error al migrar rol' });
        }
    }
    async actualizarRol(req, res) {
        try {
            const { correo, rol, ...datosPerfil } = req.body;
            if (!correo || !rol) {
                return res.status(400).json({ message: 'Correo y rol son requeridos' });
            }
            let datosArtista = undefined;
            let datosPublico = undefined;
            let datosDiscoteca = undefined;
            const nombreUsuario = datosPerfil.nombreUsuario;
            let nombre = undefined;
            if (rol === 'ARTISTA') {
                const { nombreArtistico, ciudadId, paisId, ...restoArtista } = datosPerfil;
                datosArtista = {
                    ...restoArtista,
                    ciudad: ciudadId,
                    pais: paisId
                };
                nombre = nombreArtistico;
            }
            else if (rol === 'PUBLICO') {
                const { nombre: nombrePublico, ...restoPublico } = datosPerfil;
                datosPublico = restoPublico;
                nombre = nombrePublico;
            }
            else if (rol === 'DISCOTECA') {
                datosDiscoteca = {
                    ciudad: datosPerfil.ciudadId,
                    pais: datosPerfil.paisId,
                    fechaFundacion: datosPerfil.fechaFundacion,
                    codigoTelefono: datosPerfil.codigoTelefono,
                    numeroTelefono: datosPerfil.numeroTelefono,
                    zonaHoraria: datosPerfil.zonaHoraria
                };
                nombre = datosPerfil.nombre;
            }
            const usuario = await actualizarRolUsuarioCasoUso.ejecutar(correo, rol, datosArtista, datosPublico, datosDiscoteca, nombreUsuario, nombre);
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async verificarNombreUsuario(req, res) {
        try {
            const { nombreUsuario } = req.body;
            if (!nombreUsuario) {
                return res.status(400).json({ message: 'Nombre de usuario es requerido' });
            }
            const resultado = await verificarDisponibilidadUsuarioCasoUso.ejecutar(nombreUsuario);
            return res.status(200).json(resultado);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async actualizarPerfil(req, res) {
        try {
            const { usuarioId, nombre, nombreUsuario, nombreArtistico, pais, ciudad, zonaHoraria, telefono, codigoTelefono, redesSociales, metodosDonacion, galeria, 
            // Artist Profile Fields
            biografia, categoria, tarifaPorHora, moneda, lugaresConocidos, fechaInicio, fechaFundacion, 
            // QR and Payment Fields
            imagenQR, nombreQR, urlPago, urlYoutubeFavorito, urlSoundCloudFavorito, 
            // Administration
            rol, estadoCuenta } = req.body;
            if (!usuarioId) {
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            }
            const usuario = await actualizarUsuarioCasoUso.ejecutar({
                usuarioId,
                nombre,
                nombreUsuario,
                nombreArtistico,
                pais,
                ciudad,
                zonaHoraria,
                telefono,
                codigoTelefono,
                redesSociales,
                metodosDonacion,
                galeria,
                biografia,
                categoria,
                tarifaPorHora,
                moneda,
                lugaresConocidos,
                fechaInicio,
                fechaFundacion,
                imagenQR,
                nombreQR,
                urlPago,
                urlYoutubeFavorito,
                urlSoundCloudFavorito,
                rol,
                estadoCuenta
            });
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            const err = error;
            if (err.message?.includes("Debes esperar") || err.message?.includes("ya está en uso")) {
                return res.status(400).json({ message: err.message });
            }
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async obtenerPerfil(req, res) {
        try {
            const { usuarioId } = req.params;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            const usuario = await repositorioUsuario.buscarPorId(usuarioId);
            if (!usuario)
                return res.status(404).json({ message: 'Usuario no encontrado' });
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async obtenerPaises(req, res) {
        try {
            const paises = await repositorioUsuario.obtenerPaises();
            return res.status(200).json(paises);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async obtenerCiudades(req, res) {
        try {
            const { paisId } = req.params;
            if (!paisId)
                return res.status(400).json({ message: 'ID de país es requerido' });
            const ciudades = await repositorioUsuario.obtenerCiudades(paisId);
            return res.status(200).json(ciudades);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async marcarPerfilCompletadoReconocido(req, res) {
        try {
            const { usuarioId, perfilCompletadoReconocido } = req.body;
            if (!usuarioId)
                return res.status(400).json({ message: 'ID de usuario es requerido' });
            // Use provided value or default to true for backward compatibility with existing calls
            const valor = perfilCompletadoReconocido !== undefined ? perfilCompletadoReconocido : true;
            const usuario = await repositorioUsuario.actualizar(usuarioId, {
                perfilCompletadoReconocido: valor
            });
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
    async obtenerPerfilPublico(req, res) {
        try {
            const { username } = req.params;
            const { usuarioSolicitanteId } = req.query;
            if (!username)
                return res.status(400).json({ message: 'Nombre de usuario es requerido' });
            const usuario = await repositorioUsuario.buscarPorNombreUsuario(username, usuarioSolicitanteId);
            if (!usuario)
                return res.status(404).json({ message: 'Usuario no encontrado o perfil no accesible' });
            return res.status(200).json(usuario);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
}
exports.ControladorUsuario = ControladorUsuario;
