"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = exports.RedisService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_service_1 = require("./config-service");
class RedisService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.initializeClient();
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async initializeClient() {
        let redisUrl = null;
        try {
            redisUrl = await config_service_1.configService.get('REDIS_URL');
        }
        catch {
            // Config not found, proceed without Redis
            console.log('ℹ️ Redis URL not found in config. Caching is disabled. (This is normal if you haven\'t configured Redis yet)');
            return;
        }
        if (!redisUrl) {
            console.log('ℹ️ Redis URL is empty. Caching is disabled.');
            return;
        }
        try {
            this.client = new ioredis_1.default(redisUrl, {
                maxRetriesPerRequest: 1,
                retryStrategy: (times) => {
                    if (times > 3) {
                        console.warn('⚠️ Could not connect to Redis. Retrying in 5s...');
                        return 5000;
                    }
                    return Math.min(times * 50, 2000);
                }
            });
            this.client.on('connect', () => {
                this.isConnected = true;
                console.log('✅ Connected to Redis cache');
            });
            this.client.on('error', (err) => {
                this.isConnected = false;
                console.error('❌ Redis connection error (Caching disabled):', err.message);
            });
        }
        catch (error) {
            console.error('Failed to initialize Redis client:', error);
        }
    }
    /**
     * Get a value from cache
     */
    async get(key) {
        if (!this.client || !this.isConnected)
            return null;
        try {
            return await this.client.get(key);
        }
        catch {
            console.error('Error connecting to Redis');
            return null;
        }
    }
    /**
     * Set a value in cache with optional expiry in seconds
     */
    async set(key, value, ttlSeconds = 3600) {
        if (!this.client || !this.isConnected)
            return;
        try {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        catch (error) {
            console.error(`Error setting key ${key} in Redis:`, error);
        }
    }
    /**
     * Delete a value from cache
     */
    async del(key) {
        if (!this.client || !this.isConnected)
            return;
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error(`Error deleting key ${key} from Redis:`, error);
        }
    }
}
exports.RedisService = RedisService;
exports.redisService = RedisService.getInstance();
