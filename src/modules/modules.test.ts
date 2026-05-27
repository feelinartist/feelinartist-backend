import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mocks for all presentation controllers using class constructor returning the mock object
const mockControladorAdminConfig = {
    listarRedesSociales: vi.fn(),
    listarMetodosDonacion: vi.fn(),
    crearRedSocial: vi.fn(),
    actualizarRedSocial: vi.fn(),
    eliminarRedSocial: vi.fn(),
    crearMetodoDonacion: vi.fn(),
    actualizarMetodoDonacion: vi.fn(),
    eliminarMetodoDonacion: vi.fn(),
    listarRoles: vi.fn()
};
vi.mock('../presentation/controllers/controlador-admin-config', () => ({
    ControladorAdminConfig: class {
        constructor() {
            return mockControladorAdminConfig;
        }
    }
}));

const mockControladorAutenticacion = {
    iniciarSesion: vi.fn()
};
vi.mock('../presentation/controllers/controlador-autenticacion', () => ({
    ControladorAutenticacion: class {
        constructor() {
            return mockControladorAutenticacion;
        }
    }
}));

const mockControladorConfigPublica = {
    obtenerCredencialesAuth: vi.fn()
};
vi.mock('../presentation/controllers/controlador-config-publica', () => ({
    ControladorConfigPublica: class {
        constructor() {
            return mockControladorConfigPublica;
        }
    }
}));

const mockControladorConfigSistema = {
    listarTodas: vi.fn(),
    obtenerPorClave: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn()
};
vi.mock('../presentation/controllers/controlador-config-sistema', () => ({
    ControladorConfigSistema: class {
        constructor() {
            return mockControladorConfigSistema;
        }
    }
}));

const mockControladorEvento = {
    crearEvento: vi.fn(),
    finalizarEvento: vi.fn(),
    obtenerEventoActivo: vi.fn(),
    togglePedidos: vi.fn(),
    obtenerEventosPorArtista: vi.fn(),
    obtenerEventosPaginados: vi.fn()
};
vi.mock('../presentation/controllers/controlador-evento', () => ({
    ControladorEvento: class {
        constructor() {
            return mockControladorEvento;
        }
    }
}));

const mockControladorImagenes = {
    subirImagenPerfil: vi.fn(),
    subirQRPago: vi.fn(),
    subirImagenesGaleria: vi.fn(),
    eliminarImagen: vi.fn()
};
vi.mock('../presentation/controllers/controlador-imagenes', () => ({
    ControladorImagenes: class {
        constructor() {
            return mockControladorImagenes;
        }
    }
}));

const mockControladorPedido = {
    crearPedido: vi.fn(),
    obtenerPedidosPorEvento: vi.fn(),
    actualizarEstado: vi.fn()
};
vi.mock('../presentation/controllers/controlador-pedido', () => ({
    ControladorPedido: class {
        constructor() {
            return mockControladorPedido;
        }
    }
}));

const mockControladorSeguidor = {
    seguir: vi.fn(),
    dejarDeSeguir: vi.fn()
};
vi.mock('../presentation/controllers/controlador-seguidor', () => ({
    ControladorSeguidor: class {
        constructor() {
            return mockControladorSeguidor;
        }
    }
}));

const mockControladorUsuario = {
    obtenerPerfilPublico: vi.fn(),
    buscarArtistas: vi.fn(),
    obtenerPerfil: vi.fn(),
    actualizarRol: vi.fn(),
    actualizarPerfil: vi.fn(),
    verificarNombreUsuario: vi.fn(),
    marcarPerfilCompletadoReconocido: vi.fn(),
    deshabilitarCuenta: vi.fn(),
    eliminarCuenta: vi.fn(),
    reactivarCuenta: vi.fn(),
    bloquearUsuario: vi.fn(),
    desbloquearUsuario: vi.fn(),
    obtenerBloqueados: vi.fn(),
    migrarRol: vi.fn(),
    banearUsuario: vi.fn(),
    eliminarPermanente: vi.fn(),
    listarUsuarios: vi.fn(),
    obtenerPaises: vi.fn(),
    obtenerCiudades: vi.fn(),
    eliminarPerfilEspecifico: vi.fn()
};
vi.mock('../presentation/controllers/controlador-usuario', () => ({
    ControladorUsuario: class {
        constructor() {
            return mockControladorUsuario;
        }
    }
}));

const mockControladorEstadisticas = {
    obtenerEstadisticasEvento: vi.fn(),
    obtenerDetalleCancionesEvento: vi.fn(),
    obtenerEstadisticasArtista: vi.fn(),
    obtenerGenerosArtista: vi.fn(),
    obtenerTopCanciones: vi.fn(),
    obtenerDetalleCancionesArtista: vi.fn()
};
vi.mock('../presentation/controllers/controlador-estadisticas', () => ({
    ControladorEstadisticas: class {
        constructor() {
            return mockControladorEstadisticas;
        }
    }
}));

// Mock SocketService
const mockSocketServiceInstance = {
    init: vi.fn()
};
vi.mock('../infrastructure/services/socket-service', () => ({
    SocketService: {
        getInstance: vi.fn().mockImplementation(() => mockSocketServiceInstance)
    }
}));

// Imports of controllers
import { AdminConfigController } from './admin-config/admin-config.controller';
import { AuthController } from './auth/auth.controller';
import { EventsController } from './events/events.controller';
import { UserEventSettingsController } from './events/user-event-settings.controller';
import { FollowersController } from './followers/followers.controller';
import { HealthController } from './health/health.controller';
import { ImagesController } from './images/images.controller';
import { OrdersController } from './orders/orders.controller';
import { PublicConfigController } from './public-config/public-config.controller';
import { SocketGateway } from './sockets/socket.gateway';
import { StatisticsController } from './statistics/statistics.controller';
import { SystemConfigController } from './system-config/system-config.controller';
import { UsersAdminController } from './users/users-admin.controller';
import { UsersPublicController } from './users/users-public.controller';
import { UsersController } from './users/users.controller';

describe('NestJS Modules Controllers delegation tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        jsonMock = vi.fn().mockReturnThis();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            params: {},
            query: {},
            body: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    it('AdminConfigController', () => {
        const controller = new AdminConfigController();
        controller.listarRedesSociales(req as Request, res as Response);
        expect(mockControladorAdminConfig.listarRedesSociales).toHaveBeenCalledWith(req, res);

        controller.listarMetodosDonacion(req as Request, res as Response);
        expect(mockControladorAdminConfig.listarMetodosDonacion).toHaveBeenCalledWith(req, res);

        controller.crearRedSocial(req as Request, res as Response);
        expect(mockControladorAdminConfig.crearRedSocial).toHaveBeenCalledWith(req, res);

        controller.actualizarRedSocial('id', req as Request, res as Response);
        expect(mockControladorAdminConfig.actualizarRedSocial).toHaveBeenCalledWith(req, res);

        controller.eliminarRedSocial('id', req as Request, res as Response);
        expect(mockControladorAdminConfig.eliminarRedSocial).toHaveBeenCalledWith(req, res);

        controller.crearMetodoDonacion(req as Request, res as Response);
        expect(mockControladorAdminConfig.crearMetodoDonacion).toHaveBeenCalledWith(req, res);

        controller.actualizarMetodoDonacion('id', req as Request, res as Response);
        expect(mockControladorAdminConfig.actualizarMetodoDonacion).toHaveBeenCalledWith(req, res);

        controller.eliminarMetodoDonacion('id', req as Request, res as Response);
        expect(mockControladorAdminConfig.eliminarMetodoDonacion).toHaveBeenCalledWith(req, res);

        controller.listarRoles(req as Request, res as Response);
        expect(mockControladorAdminConfig.listarRoles).toHaveBeenCalledWith(req, res);
    });

    it('AuthController', () => {
        const controller = new AuthController();
        controller.iniciarSesion(req as Request, res as Response);
        expect(mockControladorAutenticacion.iniciarSesion).toHaveBeenCalledWith(req, res);
    });

    it('EventsController', () => {
        const controller = new EventsController();
        controller.crearEvento(req as Request, res as Response);
        expect(mockControladorEvento.crearEvento).toHaveBeenCalledWith(req, res);

        controller.finalizarEvento('id', req as Request, res as Response);
        expect(mockControladorEvento.finalizarEvento).toHaveBeenCalledWith(req, res);

        controller.obtenerEventoActivo('artista-id', req as Request, res as Response);
        expect(mockControladorEvento.obtenerEventoActivo).toHaveBeenCalledWith(req, res);

        controller.obtenerEventosPorArtista('artista-id', req as Request, res as Response);
        expect(mockControladorEvento.obtenerEventosPorArtista).toHaveBeenCalledWith(req, res);

        controller.obtenerEventosPaginados('artista-id', req as Request, res as Response);
        expect(mockControladorEvento.obtenerEventosPaginados).toHaveBeenCalledWith(req, res);
    });

    it('UserEventSettingsController', () => {
        const controller = new UserEventSettingsController();
        controller.togglePedidos(req as Request, res as Response);
        expect(mockControladorEvento.togglePedidos).toHaveBeenCalledWith(req, res);
    });

    it('FollowersController', () => {
        const controller = new FollowersController();
        controller.seguir(req as Request, res as Response);
        expect(mockControladorSeguidor.seguir).toHaveBeenCalledWith(req, res);

        controller.dejarDeSeguir(req as Request, res as Response);
        expect(mockControladorSeguidor.dejarDeSeguir).toHaveBeenCalledWith(req, res);
    });

    it('HealthController', () => {
        const controller = new HealthController();
        const response = controller.health();
        expect(response).toEqual({ status: 'ok' });
    });

    it('ImagesController', () => {
        const controller = new ImagesController();
        controller.subirImagenesGaleria({}, req as Request, res as Response);
        expect(mockControladorImagenes.subirImagenesGaleria).toHaveBeenCalledWith(req, res);

        controller.subirQRPago({}, req as Request, res as Response);
        expect(mockControladorImagenes.subirQRPago).toHaveBeenCalledWith(req, res);

        controller.subirImagenPerfil({}, req as Request, res as Response);
        expect(mockControladorImagenes.subirImagenPerfil).toHaveBeenCalledWith(req, res);

        controller.eliminarImagen(req as Request, res as Response);
        expect(mockControladorImagenes.eliminarImagen).toHaveBeenCalledWith(req, res);
    });

    it('OrdersController', () => {
        const controller = new OrdersController();
        controller.crearPedido(req as Request, res as Response);
        expect(mockControladorPedido.crearPedido).toHaveBeenCalledWith(req, res);

        controller.obtenerPedidosPorEvento('evento-id', req as Request, res as Response);
        expect(mockControladorPedido.obtenerPedidosPorEvento).toHaveBeenCalledWith(req, res);

        controller.actualizarEstado('id', req as Request, res as Response);
        expect(mockControladorPedido.actualizarEstado).toHaveBeenCalledWith(req, res);
    });

    it('PublicConfigController', () => {
        const controller = new PublicConfigController();
        controller.obtenerCredencialesAuth(req as Request, res as Response);
        expect(mockControladorConfigPublica.obtenerCredencialesAuth).toHaveBeenCalledWith(req, res);
    });

    it('StatisticsController', () => {
        const controller = new StatisticsController();
        controller.obtenerEstadisticasEvento('id', req as Request, res as Response);
        expect(mockControladorEstadisticas.obtenerEstadisticasEvento).toHaveBeenCalledWith(req, res);

        controller.obtenerDetalleCancionesEvento('id', req as Request, res as Response);
        expect(mockControladorEstadisticas.obtenerDetalleCancionesEvento).toHaveBeenCalledWith(req, res);

        controller.obtenerEstadisticasArtista('id', req as Request, res as Response);
        expect(mockControladorEstadisticas.obtenerEstadisticasArtista).toHaveBeenCalledWith(req, res);

        controller.obtenerGenerosArtista('id', req as Request, res as Response);
        expect(mockControladorEstadisticas.obtenerGenerosArtista).toHaveBeenCalledWith(req, res);

        controller.obtenerTopCanciones('id', req as Request, res as Response);
        expect(mockControladorEstadisticas.obtenerTopCanciones).toHaveBeenCalledWith(req, res);

        controller.obtenerDetalleCancionesArtista('id', req as Request, res as Response);
        expect(mockControladorEstadisticas.obtenerDetalleCancionesArtista).toHaveBeenCalledWith(req, res);
    });

    it('SystemConfigController', () => {
        const controller = new SystemConfigController();
        controller.listarTodas(req as Request, res as Response);
        expect(mockControladorConfigSistema.listarTodas).toHaveBeenCalledWith(req, res);

        controller.obtenerPorClave('id', req as Request, res as Response);
        expect(mockControladorConfigSistema.obtenerPorClave).toHaveBeenCalledWith(req, res);

        controller.crear(req as Request, res as Response);
        expect(mockControladorConfigSistema.crear).toHaveBeenCalledWith(req, res);

        controller.actualizar('id', req as Request, res as Response);
        expect(mockControladorConfigSistema.actualizar).toHaveBeenCalledWith(req, res);

        controller.eliminar('id', req as Request, res as Response);
        expect(mockControladorConfigSistema.eliminar).toHaveBeenCalledWith(req, res);
    });

    it('UsersAdminController', () => {
        const controller = new UsersAdminController();
        controller.listarUsuarios(req as Request, res as Response);
        expect(mockControladorUsuario.listarUsuarios).toHaveBeenCalledWith(req, res);

        controller.eliminarPerfilEspecifico('tipo', req as Request, res as Response);
        expect(mockControladorUsuario.eliminarPerfilEspecifico).toHaveBeenCalledWith(req, res);
    });

    it('UsersPublicController', () => {
        const controller = new UsersPublicController();
        controller.obtenerPaises(req as Request, res as Response);
        expect(mockControladorUsuario.obtenerPaises).toHaveBeenCalledWith(req, res);

        controller.obtenerCiudades('pais', req as Request, res as Response);
        expect(mockControladorUsuario.obtenerCiudades).toHaveBeenCalledWith(req, res);
    });

    it('UsersController', () => {
        const controller = new UsersController();
        controller.obtenerPerfilPublico(req as Request, res as Response);
        expect(mockControladorUsuario.obtenerPerfilPublico).toHaveBeenCalledWith(req, res);

        controller.buscarArtistas(req as Request, res as Response);
        expect(mockControladorUsuario.buscarArtistas).toHaveBeenCalledWith(req, res);

        controller.obtenerPerfil(req as Request, res as Response);
        expect(mockControladorUsuario.obtenerPerfil).toHaveBeenCalledWith(req, res);

        controller.actualizarRol({}, req as Request, res as Response);
        expect(mockControladorUsuario.actualizarRol).toHaveBeenCalledWith(req, res);

        controller.actualizarPerfil({}, req as Request, res as Response);
        expect(mockControladorUsuario.actualizarPerfil).toHaveBeenCalledWith(req, res);

        controller.verificarNombreUsuario({}, req as Request, res as Response);
        expect(mockControladorUsuario.verificarNombreUsuario).toHaveBeenCalledWith(req, res);

        controller.marcarPerfilCompletadoReconocido(req as Request, res as Response);
        expect(mockControladorUsuario.marcarPerfilCompletadoReconocido).toHaveBeenCalledWith(req, res);

        controller.deshabilitarCuenta(req as Request, res as Response);
        expect(mockControladorUsuario.deshabilitarCuenta).toHaveBeenCalledWith(req, res);

        controller.eliminarCuenta(req as Request, res as Response);
        expect(mockControladorUsuario.eliminarCuenta).toHaveBeenCalledWith(req, res);

        controller.reactivarCuenta(req as Request, res as Response);
        expect(mockControladorUsuario.reactivarCuenta).toHaveBeenCalledWith(req, res);

        controller.bloquearUsuario({}, req as Request, res as Response);
        expect(mockControladorUsuario.bloquearUsuario).toHaveBeenCalledWith(req, res);

        controller.desbloquearUsuario({}, req as Request, res as Response);
        expect(mockControladorUsuario.desbloquearUsuario).toHaveBeenCalledWith(req, res);

        // Param is unused but mapped to req inside obtenerBloqueados
        controller.obtenerBloqueados('id', req as Request, res as Response);
        expect(mockControladorUsuario.obtenerBloqueados).toHaveBeenCalledWith(req, res);

        controller.migrarRol(req as Request, res as Response);
        expect(mockControladorUsuario.migrarRol).toHaveBeenCalledWith(req, res);

        controller.banearUsuario(req as Request, res as Response);
        expect(mockControladorUsuario.banearUsuario).toHaveBeenCalledWith(req, res);

        controller.eliminarPermanente(req as Request, res as Response);
        expect(mockControladorUsuario.eliminarPermanente).toHaveBeenCalledWith(req, res);
    });

    it('SocketGateway', () => {
        const gateway = new SocketGateway();
        const mockServer = {} as any;
        const mockSocket = {
            id: 'socket-id',
            join: vi.fn()
        } as any;

        gateway.afterInit(mockServer);
        expect(mockSocketServiceInstance.init).toHaveBeenCalledWith(mockServer);

        // Simple logs coverage
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        gateway.handleConnection(mockSocket);
        expect(consoleSpy).toHaveBeenCalledWith('Client connected:', 'socket-id');

        gateway.handleDisconnect(mockSocket);
        expect(consoleSpy).toHaveBeenCalledWith('Client disconnected:', 'socket-id');

        gateway.joinEvent(mockSocket, 'event-1');
        expect(consoleSpy).toHaveBeenCalledWith('Socket socket-id joining room event:event-1');
        expect(mockSocket.join).toHaveBeenCalledWith('event:event-1');

        gateway.joinArtist(mockSocket, 'artist-1');
        expect(consoleSpy).toHaveBeenCalledWith('Socket socket-id joining room artist:artist-1');
        expect(mockSocket.join).toHaveBeenCalledWith('artist:artist-1');

        consoleSpy.mockRestore();
    });
});
