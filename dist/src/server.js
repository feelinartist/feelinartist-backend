"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./presentation/routes"));
const socket_service_1 = require("./infrastructure/services/socket-service");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Inicialización asíncrona del servidor
async function startServer() {
    // Cargar FRONTEND_URL de variables de entorno
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    // Configurar Socket.IO con la URL del frontend
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: frontendUrl,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            credentials: true
        }
    });
    // Initialize Socket Service
    socket_service_1.SocketService.getInstance().init(io);
    app.use((0, cors_1.default)());
    app.use(express_1.default.json({ limit: '50mb' }));
    app.use('/api', routes_1.default);
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('join_event', (eventId) => {
            console.log(`Socket ${socket.id} joining room event:${eventId}`);
            socket.join(`event:${eventId}`);
        });
        socket.on('join_artist', (artistId) => {
            console.log(`Socket ${socket.id} joining room artist:${artistId}`);
            socket.join(`artist:${artistId}`);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`CORS origin: ${frontendUrl}`);
    });
}
// Iniciar el servidor
startServer().catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});
