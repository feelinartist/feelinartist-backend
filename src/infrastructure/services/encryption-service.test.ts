import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EncryptionService } from './encryption-service';

describe('EncryptionService', () => {
    let originalEnvKey: string | undefined;

    beforeEach(() => {
        originalEnvKey = process.env.ENCRYPTION_KEY;
    });

    afterEach(() => {
        if (originalEnvKey !== undefined) {
            process.env.ENCRYPTION_KEY = originalEnvKey;
        } else {
            delete process.env.ENCRYPTION_KEY;
        }
    });

    it('should initialize key with env variable when defined', () => {
        process.env.ENCRYPTION_KEY = 'short-key';
        const service = new EncryptionService();
        // key will be padded to 32 bytes
        expect((service as any).key.length).toBe(32);
    });

    it('should initialize key with default fallback when env is undefined', () => {
        delete process.env.ENCRYPTION_KEY;
        const service = new EncryptionService();
        expect((service as any).key.length).toBe(32);
    });

    it('should encrypt and decrypt text successfully', () => {
        const service = new EncryptionService();
        const plainText = 'hello world';
        const encrypted = service.encrypt(plainText);
        expect(encrypted).toContain(':');
        
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(plainText);
    });

    it('should throw error when decrypting malformed input', () => {
        const service = new EncryptionService();
        
        // Malformed format (doesn't contain colon parts)
        expect(() => service.decrypt('invalid-string')).toThrow();

        // Containing colons but invalid contents
        expect(() => service.decrypt('aabbcc:ddeeff:001122')).toThrow();
    });
});
