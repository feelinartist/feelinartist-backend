import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles, ROLES_KEY } from './roles.decorator';

function createContext(request: any): ExecutionContext {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: vi.fn(),
            getNext: vi.fn(),
        }),
        getClass: () => class TestController {},
        getHandler: () => function testHandler() {},
        getType: vi.fn(),
    } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflectorSpy: any;

    beforeEach(() => {
        guard = new RolesGuard();
    });

    afterEach(() => {
        if (reflectorSpy) {
            reflectorSpy.mockRestore();
        }
    });

    it('should return true if no roles are defined', () => {
        reflectorSpy = vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(undefined);

        const request = {};
        const context = createContext(request);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
    });

    it('should throw CompatibleUnauthorizedException if user is not on request', () => {
        reflectorSpy = vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        const request = {};
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('Usuario no autenticado');
    });

    it('should throw CompatibleForbiddenException if user has no role', () => {
        reflectorSpy = vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        const request = { user: { id: 'u1', email: 'user@test.com' } };
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('No tienes permisos para esta acciÃ³n');
    });

    it('should throw CompatibleForbiddenException if user has incorrect role', () => {
        reflectorSpy = vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(['ADMIN']);

        const request = { user: { id: 'u1', email: 'user@test.com', rol: 'USER' } };
        const context = createContext(request);

        expect(() => guard.canActivate(context)).toThrow('No tienes permisos para esta acciÃ³n');
    });

    it('should return true if user has allowed role', () => {
        reflectorSpy = vi.spyOn(Reflector.prototype, 'getAllAndOverride').mockReturnValue(['ADMIN', 'SUPER_ADMIN']);

        const request = { user: { id: 'u1', email: 'user@test.com', rol: 'ADMIN' } };
        const context = createContext(request);

        const result = guard.canActivate(context);

        expect(result).toBe(true);
    });

    it('Roles decorator should set metadata key and values', () => {
        const decorator = Roles('ADMIN', 'USER');
        expect(decorator).toBeDefined();
        const target = {};
        const method = () => {};
        const descriptor = { value: method } as PropertyDescriptor;
        decorator(target, 'testMethod', descriptor);
        expect(Reflect.getMetadata(ROLES_KEY, descriptor.value)).toEqual(['ADMIN', 'USER']);
    });
});
