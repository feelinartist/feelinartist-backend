import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32b'; // Must be 32 bytes
const ALGORITHM = 'aes-256-cbc';

export class EncryptionService {
    private key: Buffer;

    constructor() {
        // Ensure key is exactly 32 bytes
        this.key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    }

    encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Return iv + encrypted data
        return iv.toString('hex') + ':' + encrypted;
    }

    decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
