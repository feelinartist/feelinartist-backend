"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QrService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
class QrService {
    async generateQrCode(text) {
        try {
            // Generate QR code as a Buffer
            // Generate QR code as a Buffer with higher resolution
            const qrBuffer = await qrcode_1.default.toBuffer(text, { width: 500, margin: 2 });
            return qrBuffer;
        }
        catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }
}
exports.QrService = QrService;
