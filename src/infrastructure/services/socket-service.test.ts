import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Server } from 'socket.io';
import { SocketService } from './socket-service';

describe('SocketService', () => {
    beforeEach(() => {
        // Reset the singleton instance and private properties before each test
        (SocketService as any).instance = undefined;
    });

    it('should return the singleton instance on getInstance', () => {
        const instance1 = SocketService.getInstance();
        const instance2 = SocketService.getInstance();

        expect(instance1).toBeInstanceOf(SocketService);
        expect(instance1).toBe(instance2);
    });

    it('should throw an error on getIO if not initialized', () => {
        const service = SocketService.getInstance();
        expect(() => service.getIO()).toThrow('Socket.io not initialized!');
    });

    it('should initialize and return the Server instance', () => {
        const service = SocketService.getInstance();
        const mockServer = {} as Server;

        service.init(mockServer);

        expect(service.getIO()).toBe(mockServer);
    });
});
