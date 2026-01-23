"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
class SocketService {
    constructor() {
        this.io = null;
    }
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    init(io) {
        this.io = io;
    }
    getIO() {
        if (!this.io) {
            throw new Error('Socket.io not initialized!');
        }
        return this.io;
    }
}
exports.SocketService = SocketService;
