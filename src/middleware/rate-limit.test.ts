import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { redisService } from '../infrastructure/services/redis-service';

// Use vi.hoisted to ensure mocks are defined before hoisting
const {
    capturedStores,
    mockRateLimiterMiddleware,
    mockLocalStoreInit,
    mockLocalStoreIncrement,
    mockLocalStoreDecrement,
    mockLocalStoreResetKey,
} = vi.hoisted(() => {
    return {
        capturedStores: [] as any[],
        mockRateLimiterMiddleware: vi.fn().mockImplementation((req, res, next) => next()),
        mockLocalStoreInit: vi.fn(),
        mockLocalStoreIncrement: vi.fn(),
        mockLocalStoreDecrement: vi.fn(),
        mockLocalStoreResetKey: vi.fn(),
    };
});

vi.mock('express-rate-limit', () => {
    class MockMemoryStore {
        init = mockLocalStoreInit;
        increment = mockLocalStoreIncrement;
        decrement = mockLocalStoreDecrement;
        resetKey = mockLocalStoreResetKey;
    }
    return {
        default: vi.fn().mockImplementation((options) => {
            if (options && options.store) {
                capturedStores.push(options.store);
            }
            return mockRateLimiterMiddleware;
        }),
        MemoryStore: MockMemoryStore,
    };
});

// Mock redisService
vi.mock('../infrastructure/services/redis-service', () => {
    return {
        redisService: {
            getClient: vi.fn(),
            getIsConnected: vi.fn(),
        },
    };
});

// Mock rate-limit-redis
const mockRedisStoreInit = vi.fn();
const mockRedisStoreIncrement = vi.fn();
const mockRedisStoreDecrement = vi.fn();
const mockRedisStoreResetKey = vi.fn();

const { mockRedisStoreConstructor } = vi.hoisted(() => {
    const mockCtor = vi.fn().mockImplementation(function (this: any, options: any) {
        this.init = mockRedisStoreInit;
        this.increment = mockRedisStoreIncrement;
        this.decrement = mockRedisStoreDecrement;
        this.resetKey = mockRedisStoreResetKey;
        // Verify the sendCommand option
        if (options && options.sendCommand) {
            options.sendCommand('arg1', 'arg2');
        }
    });
    return { mockRedisStoreConstructor: mockCtor };
});

vi.mock('rate-limit-redis', () => {
    return {
        RedisStore: mockRedisStoreConstructor,
    };
});

import { generalLimiter, authLimiter, uploadLimiter } from './rate-limit';

describe('Rate Limit Middleware', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let consoleErrorSpy: any;

    beforeEach(() => {
        originalEnv = { ...process.env };
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = originalEnv;
        consoleErrorSpy.mockRestore();
    });

    describe('Environment Bypass', () => {
        it('should bypass rate limiting in development/test environment', () => {
            process.env.NODE_ENV = 'test';

            const req = {} as Request;
            const res = {} as Response;
            const next = vi.fn();

            generalLimiter(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockRateLimiterMiddleware).not.toHaveBeenCalled();

            next.mockClear();
            authLimiter(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockRateLimiterMiddleware).not.toHaveBeenCalled();

            next.mockClear();
            uploadLimiter(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(mockRateLimiterMiddleware).not.toHaveBeenCalled();
        });

        it('should execute rate limiting in production environment', () => {
            process.env.NODE_ENV = 'production';

            const req = {} as Request;
            const res = {} as Response;
            const next = vi.fn();

            generalLimiter(req, res, next);
            expect(mockRateLimiterMiddleware).toHaveBeenLastCalledWith(req, res, next);
            expect(next).toHaveBeenCalled();

            next.mockClear();
            mockRateLimiterMiddleware.mockClear();
            authLimiter(req, res, next);
            expect(mockRateLimiterMiddleware).toHaveBeenLastCalledWith(req, res, next);
            expect(next).toHaveBeenCalled();

            next.mockClear();
            mockRateLimiterMiddleware.mockClear();
            uploadLimiter(req, res, next);
            expect(mockRateLimiterMiddleware).toHaveBeenLastCalledWith(req, res, next);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('DynamicStore', () => {
        it('should have captured the stores', () => {
            expect(capturedStores.length).toBe(3);
        });

        it('should fallback to local MemoryStore when Redis is disconnected', async () => {
            vi.mocked(redisService.getClient).mockReturnValue(null);
            vi.mocked(redisService.getIsConnected).mockReturnValue(false);

            const store = capturedStores[0]; // general store
            
            await store.increment('ip-1');
            expect(mockLocalStoreIncrement).toHaveBeenCalledWith('ip-1');

            await store.decrement('ip-1');
            expect(mockLocalStoreDecrement).toHaveBeenCalledWith('ip-1');

            await store.resetKey('ip-1');
            expect(mockLocalStoreResetKey).toHaveBeenCalledWith('ip-1');

            expect(mockRedisStoreConstructor).not.toHaveBeenCalled();
        });

        it('should use RedisStore when Redis is connected', async () => {
            const mockClient = {
                call: vi.fn().mockResolvedValue('redis-ok')
            };
            vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);
            vi.mocked(redisService.getIsConnected).mockReturnValue(true);

            const store = capturedStores[0]; // general store
            store.init({});
            expect(mockLocalStoreInit).toHaveBeenCalled();

            // Trigger getStore() via operations
            await store.increment('ip-2');
            expect(mockRedisStoreConstructor).toHaveBeenCalled();
            expect(mockRedisStoreIncrement).toHaveBeenCalledWith('ip-2');
            expect(mockClient.call).toHaveBeenCalledWith('arg1', 'arg2');

            await store.decrement('ip-2');
            expect(mockRedisStoreDecrement).toHaveBeenCalledWith('ip-2');

            await store.resetKey('ip-2');
            expect(mockRedisStoreResetKey).toHaveBeenCalledWith('ip-2');
            
            // Second call should reuse the initialized redisStore without constructing again
            mockRedisStoreConstructor.mockClear();
            await store.increment('ip-2');
            expect(mockRedisStoreConstructor).not.toHaveBeenCalled();
        });

        it('should log error and fallback to localStore if RedisStore construction throws error', async () => {
            const mockClient = {
                call: vi.fn()
            };
            vi.mocked(redisService.getClient).mockReturnValue(mockClient as any);
            vi.mocked(redisService.getIsConnected).mockReturnValue(true);

            // Force construction to fail (auth store is capturedStores[1])
            mockRedisStoreConstructor.mockImplementationOnce(() => {
                throw new Error('RedisStore instantiation error');
            });

            const store = capturedStores[1];
            store.init({});

            await store.increment('ip-error');

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockLocalStoreIncrement).toHaveBeenCalledWith('ip-error');
        });
    });
});
