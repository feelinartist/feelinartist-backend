import Redis from 'ioredis';
import { configService } from './config-service';

export class RedisService {
    private static instance: RedisService;
    private client: Redis | null = null;
    private isConnected: boolean = false;

    private constructor() {
        this.initializeClient();
    }

    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    private async initializeClient() {
        let redisUrl: string | null = null;
        try {
            redisUrl = await configService.get('REDIS_URL');
        } catch {
            // Config not found, proceed without Redis
            console.log('ℹ️ Redis URL not found in config. Caching is disabled. (This is normal if you haven\'t configured Redis yet)');
            return;
        }

        if (!redisUrl) {
            console.log('ℹ️ Redis URL is empty. Caching is disabled.');
            return;
        }

        try {
            this.client = new Redis(redisUrl, {
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
        } catch (error) {
            console.error('Failed to initialize Redis client:', error);
        }
    }

    /**
     * Get a value from cache
     */
    public async get(key: string): Promise<string | null> {
        if (!this.client || !this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch {
            console.error('Error connecting to Redis');
            return null;
        }
    }

    /**
     * Set a value in cache with optional expiry in seconds
     */
    public async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.set(key, value, 'EX', ttlSeconds);
        } catch (error) {
            console.error(`Error setting key ${key} in Redis:`, error);
        }
    }

    /**
     * Delete a value from cache
     */
    public async del(key: string): Promise<void> {
        if (!this.client || !this.isConnected) return;
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Error deleting key ${key} from Redis:`, error);
        }
    }
}

export const redisService = RedisService.getInstance();
