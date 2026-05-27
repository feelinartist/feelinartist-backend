import { describe, it, expect } from 'vitest';
import { uploadGallerySchema, uploadQRSchema, uploadProfileSchema } from './image.schema';

describe('Image Schemas Validation', () => {
    describe('uploadGallerySchema', () => {
        it('should validate correct gallery upload data', () => {
            const result = uploadGallerySchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                images: ['image1.jpg', 'image2.png']
            });
            expect(result.success).toBe(true);
        });

        it('should fail validation with invalid user ID', () => {
            const result = uploadGallerySchema.safeParse({
                usuarioId: 'invalid-uuid',
                images: ['image1.jpg']
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('ID de usuario inválido');
            }
        });

        it('should fail validation with zero images', () => {
            const result = uploadGallerySchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                images: []
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Debe proporcionar al menos una imagen');
            }
        });

        it('should fail validation with more than 6 images', () => {
            const result = uploadGallerySchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                images: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg']
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Máximo 6 imágenes permitidas');
            }
        });
    });

    describe('uploadQRSchema', () => {
        it('should validate correct QR upload data with optional fields', () => {
            const result = uploadQRSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                image: 'qr_code.png',
                nombreQR: 'Yape',
                urlPago: 'https://yape.com.pe/pay'
            });
            expect(result.success).toBe(true);
        });

        it('should validate correct QR upload data with only required fields', () => {
            const result = uploadQRSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                image: 'qr_code.png'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with invalid payment URL', () => {
            const result = uploadQRSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                image: 'qr_code.png',
                urlPago: 'not-a-url'
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('URL de pago inválida');
            }
        });

        it('should fail with empty image', () => {
            const result = uploadQRSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                image: ''
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('La imagen QR es requerida');
            }
        });
    });

    describe('uploadProfileSchema', () => {
        it('should validate correct profile upload data', () => {
            const result = uploadProfileSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                image: 'avatar.png'
            });
            expect(result.success).toBe(true);
        });

        it('should fail with empty image', () => {
            const result = uploadProfileSchema.safeParse({
                usuarioId: '123e4567-e89b-12d3-a456-426614174000',
                image: ''
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('La imagen es requerida');
            }
        });
    });
});
