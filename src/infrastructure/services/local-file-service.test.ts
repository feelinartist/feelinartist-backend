import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { LocalFileService } from './local-file-service';

// Mock node:fs
vi.mock('node:fs', () => {
    return {
        default: {
            existsSync: vi.fn(),
            mkdirSync: vi.fn(),
            unlinkSync: vi.fn(),
        },
    };
});

// Mock sharp using vi.hoisted to prevent hoisting reference errors
const { mockToFile, mockWebp, mockSharp } = vi.hoisted(() => {
    const toFile = vi.fn().mockResolvedValue(undefined);
    const webp = vi.fn().mockReturnValue({ toFile });
    const sharpFn = vi.fn().mockReturnValue({ webp });
    return { mockToFile: toFile, mockWebp: webp, mockSharp: sharpFn };
});

vi.mock('sharp', () => {
    return {
        default: mockSharp,
    };
});

describe('LocalFileService', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let consoleErrorSpy: any;

    beforeEach(() => {
        originalEnv = { ...process.env };
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Reset the mock implementations/resolved values for sharp chains
        mockToFile.mockReset();
        mockToFile.mockResolvedValue(undefined);
        mockWebp.mockClear();
        mockSharp.mockClear();
    });

    afterEach(() => {
        process.env = originalEnv;
        consoleErrorSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should create uploads directory if it does not exist', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            
            new LocalFileService();
            
            expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('uploads'));
            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('uploads'), { recursive: true });
        });

        it('should not create uploads directory if it already exists', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            
            new LocalFileService();
            
            expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('uploads'));
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });

        it('should use default port 3001, default host localhost, and http in non-production', () => {
            delete process.env.PORT;
            delete process.env.BACKEND_HOST;
            process.env.NODE_ENV = 'development';
            delete process.env.BACKEND_URL;

            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();
            expect((service as any).baseUrl).toBe('http://localhost:3001');
        });

        it('should use environment variables if defined', () => {
            process.env.PORT = '4000';
            process.env.BACKEND_HOST = 'myapi.com';
            process.env.NODE_ENV = 'production';
            delete process.env.BACKEND_URL;

            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();
            expect((service as any).baseUrl).toBe('https://myapi.com:4000');
        });

        it('should use BACKEND_URL if specified in environment variables', () => {
            process.env.BACKEND_URL = 'https://custom-domain.com';
            
            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();
            expect((service as any).baseUrl).toBe('https://custom-domain.com');
        });
    });

    describe('uploadBase64Image', () => {
        it('should upload a valid base64 image with data URI header successfully', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();
            
            // Mock directory exists for userDir
            vi.mocked(fs.existsSync).mockReturnValue(false); // return false for userDir to trigger mkdirSync

            const base64Image = 'data:image/jpeg;base64,aGVsbG8='; // 'hello' in base64
            const result = await service.uploadBase64Image(base64Image, 'user123', 'profile', 'avatar');

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining(path.join('users', 'user123', 'profile')), { recursive: true });
            expect(mockSharp).toHaveBeenCalledWith(Buffer.from('aGVsbG8=', 'base64'));
            expect(mockWebp).toHaveBeenCalledWith({ quality: 80 });
            expect(mockToFile).toHaveBeenCalledWith(expect.stringContaining(path.join('users', 'user123', 'profile', 'avatar.webp')));
            expect(result).toEqual({
                url: '/uploads/users/user123/profile/avatar.webp',
                publicId: 'users/user123/profile/avatar',
            });
        });

        it('should upload a raw base64 image (without header) successfully', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();

            const base64Image = 'aGVsbG8='; // valid base64 string
            const result = await service.uploadBase64Image(base64Image, 'user123', 'gallery');

            expect(mockSharp).toHaveBeenCalledWith(Buffer.from('aGVsbG8=', 'base64'));
            expect(result.url).toContain('/uploads/users/user123/gallery/gallery_');
            expect(result.publicId).toContain('users/user123/gallery/gallery_');
        });

        it('should throw error when base64 string is invalid', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();

            const invalidBase64 = 'invalid_char_$%^';
            await expect(service.uploadBase64Image(invalidBase64, 'user123', 'payment')).rejects.toThrow(
                'Error al guardar la imagen localmente'
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should log and throw error when sharp operations fail', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();
            mockToFile.mockRejectedValueOnce(new Error('Sharp save failed'));

            const base64Image = 'data:image/jpeg;base64,aGVsbG8=';
            await expect(service.uploadBase64Image(base64Image, 'user123', 'payment')).rejects.toThrow(
                'Error al guardar la imagen localmente'
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('deleteImage', () => {
        it('should delete file if file with .webp extension exists', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true); // first check exists
            
            const service = new LocalFileService();
            await service.deleteImage('users/user123/profile/avatar');

            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining(path.join('users', 'user123', 'profile', 'avatar.webp')));
        });

        it('should delete file if file without extra .webp extension exists (provided with extension)', async () => {
            // simulate first check false, second check true
            vi.mocked(fs.existsSync)
                .mockReturnValueOnce(true) // constructor
                .mockReturnValueOnce(false) // SafePath + .webp
                .mockReturnValueOnce(true); // SafePath

            const service = new LocalFileService();
            await service.deleteImage('users/user123/profile/avatar.webp');

            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining(path.join('users', 'user123', 'profile', 'avatar.webp')));
        });

        it('should do nothing if file does not exist', async () => {
            vi.mocked(fs.existsSync)
                .mockReturnValueOnce(true) // constructor
                .mockReturnValueOnce(false) // SafePath + .webp
                .mockReturnValueOnce(false); // SafePath

            const service = new LocalFileService();
            await service.deleteImage('users/user123/profile/avatar');

            expect(fs.unlinkSync).not.toHaveBeenCalled();
        });

        it('should throw error when fs operation fails', async () => {
            vi.mocked(fs.existsSync)
                .mockReturnValueOnce(true) // constructor
                .mockImplementation(() => {
                    throw new Error('Disk error');
                });

            const service = new LocalFileService();
            await expect(service.deleteImage('users/user123/profile/avatar')).rejects.toThrow(
                'Error al eliminar la imagen local'
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('deleteImages', () => {
        it('should call deleteImage for each public ID', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            const service = new LocalFileService();
            const spyDelete = vi.spyOn(service, 'deleteImage').mockResolvedValue(undefined);

            await service.deleteImages(['id1', 'id2', 'id3']);

            expect(spyDelete).toHaveBeenCalledTimes(3);
            expect(spyDelete).toHaveBeenNthCalledWith(1, 'id1');
            expect(spyDelete).toHaveBeenNthCalledWith(2, 'id2');
            expect(spyDelete).toHaveBeenNthCalledWith(3, 'id3');
        });
    });
});
