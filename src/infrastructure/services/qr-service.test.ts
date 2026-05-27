import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QRCode from 'qrcode';
import { QrService } from './qr-service';

vi.mock('qrcode', () => {
    return {
        default: {
            toBuffer: vi.fn(),
        },
    };
});

describe('QrService', () => {
    let consoleErrorSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should generate QR code buffer successfully', async () => {
        const mockBuffer = Buffer.from('mock-qr-data');
        vi.mocked(QRCode.toBuffer).mockResolvedValue(mockBuffer as any);

        const service = new QrService();
        const result = await service.generateQrCode('https://test.com');

        expect(QRCode.toBuffer).toHaveBeenCalledWith('https://test.com', { width: 500, margin: 2 });
        expect(result).toBe(mockBuffer);
    });

    it('should log and throw error when QRCode generation fails', async () => {
        vi.mocked(QRCode.toBuffer).mockRejectedValue(new Error('QR Generation Error'));

        const service = new QrService();
        await expect(service.generateQrCode('https://test.com')).rejects.toThrow('Failed to generate QR code');
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});
