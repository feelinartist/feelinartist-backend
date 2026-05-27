import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock target service
vi.mock('../../infrastructure/services/local-file-service', () => {
    return {
        LocalFileService: class MockLocalFileService {
            uploadBase64Image = (...args: any[]) => (globalThis as any).mockUploadBase64Image(...args);
            deleteImage = (...args: any[]) => (globalThis as any).mockDeleteImage(...args);
        }
    };
});

// Assign actual spy functions to globalThis
(globalThis as any).mockUploadBase64Image = vi.fn();
(globalThis as any).mockDeleteImage = vi.fn();

import { ControladorImagenes } from './controlador-imagenes';

describe('ControladorImagenes', () => {
    let controller: ControladorImagenes;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        controller = new ControladorImagenes();

        jsonMock = vi.fn();
        statusMock = vi.fn().mockImplementation(() => ({ json: jsonMock }));
        req = {
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: statusMock,
            json: jsonMock
        };
    });

    describe('subirImagenesGaleria', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = { images: ['img1', 'img2'] };

            await controller.subirImagenesGaleria(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should return 400 if images is missing', async () => {
            req.body = { usuarioId: 'user-1' };

            await controller.subirImagenesGaleria(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should return 400 if images is not an array', async () => {
            req.body = { usuarioId: 'user-1', images: 'not-an-array' };

            await controller.subirImagenesGaleria(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should upload images in gallery and return URLs with status 200', async () => {
            req.body = { usuarioId: 'user-1', images: ['img-base64-1', 'img-base64-2'] };
            (globalThis as any).mockUploadBase64Image
                .mockResolvedValueOnce({ url: 'http://localhost/image1.jpg' })
                .mockResolvedValueOnce({ url: 'http://localhost/image2.jpg' });

            await controller.subirImagenesGaleria(req as Request, res as Response);

            expect((globalThis as any).mockUploadBase64Image).toHaveBeenCalledTimes(2);
            expect((globalThis as any).mockUploadBase64Image).toHaveBeenNthCalledWith(
                1,
                'img-base64-1',
                'user-1',
                'gallery',
                expect.stringMatching(/^image_\d+_0$/)
            );
            expect((globalThis as any).mockUploadBase64Image).toHaveBeenNthCalledWith(
                2,
                'img-base64-2',
                'user-1',
                'gallery',
                expect.stringMatching(/^image_\d+_1$/)
            );
            expect(jsonMock).toHaveBeenCalledWith({
                urls: ['http://localhost/image1.jpg', 'http://localhost/image2.jpg']
            });
        });

        it('should return 500 status with specific error message on upload failure', async () => {
            req.body = { usuarioId: 'user-1', images: ['img-base64-1'] };
            (globalThis as any).mockUploadBase64Image.mockRejectedValue(new Error('Resize failed'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.subirImagenesGaleria(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Resize failed' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 status with fallback error message on upload failure without a message', async () => {
            req.body = { usuarioId: 'user-1', images: ['img-base64-1'] };
            (globalThis as any).mockUploadBase64Image.mockRejectedValue(new Error(''));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.subirImagenesGaleria(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al subir las imágenes' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('subirQRPago', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = { image: 'img-base64' };

            await controller.subirQRPago(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should return 400 if image is missing', async () => {
            req.body = { usuarioId: 'user-1' };

            await controller.subirQRPago(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should upload QR payment image and return URL with status 200', async () => {
            req.body = { usuarioId: 'user-1', image: 'img-base64' };
            (globalThis as any).mockUploadBase64Image.mockResolvedValue({ url: 'http://localhost/qr.jpg' });

            await controller.subirQRPago(req as Request, res as Response);

            expect((globalThis as any).mockUploadBase64Image).toHaveBeenCalledWith(
                'img-base64',
                'user-1',
                'payment',
                'qr_payment'
            );
            expect(jsonMock).toHaveBeenCalledWith({ url: 'http://localhost/qr.jpg' });
        });

        it('should return 500 status with specific error message on upload failure', async () => {
            req.body = { usuarioId: 'user-1', image: 'img-base64' };
            (globalThis as any).mockUploadBase64Image.mockRejectedValue(new Error('Resize failed'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.subirQRPago(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Resize failed' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 status with fallback error message on upload failure without a message', async () => {
            req.body = { usuarioId: 'user-1', image: 'img-base64' };
            (globalThis as any).mockUploadBase64Image.mockRejectedValue(new Error(''));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.subirQRPago(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al subir el QR' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('subirImagenPerfil', () => {
        it('should return 400 if usuarioId is missing', async () => {
            req.body = { image: 'img-base64' };

            await controller.subirImagenPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should return 400 if image is missing', async () => {
            req.body = { usuarioId: 'user-1' };

            await controller.subirImagenPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Datos inválidos' });
        });

        it('should upload profile picture and return URL with status 200', async () => {
            req.body = { usuarioId: 'user-1', image: 'img-base64' };
            (globalThis as any).mockUploadBase64Image.mockResolvedValue({ url: 'http://localhost/profile.jpg' });

            await controller.subirImagenPerfil(req as Request, res as Response);

            expect((globalThis as any).mockUploadBase64Image).toHaveBeenCalledWith(
                'img-base64',
                'user-1',
                'profile',
                expect.stringMatching(/^profile_\d+$/)
            );
            expect(jsonMock).toHaveBeenCalledWith({ url: 'http://localhost/profile.jpg' });
        });

        it('should return 500 status with specific error message on upload failure', async () => {
            req.body = { usuarioId: 'user-1', image: 'img-base64' };
            (globalThis as any).mockUploadBase64Image.mockRejectedValue(new Error('Resize failed'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.subirImagenPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Resize failed' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 status with fallback error message on upload failure without a message', async () => {
            req.body = { usuarioId: 'user-1', image: 'img-base64' };
            (globalThis as any).mockUploadBase64Image.mockRejectedValue(new Error(''));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.subirImagenPerfil(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al subir la foto de perfil' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('eliminarImagen', () => {
        it('should return 400 if publicId is missing', async () => {
            req.body = {};

            await controller.eliminarImagen(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Public ID (path relativo) requerido' });
        });

        it('should delete image successfully and return 200 status', async () => {
            req.body = { publicId: 'some-path/img.jpg' };
            (globalThis as any).mockDeleteImage.mockResolvedValue(undefined);

            await controller.eliminarImagen(req as Request, res as Response);

            expect((globalThis as any).mockDeleteImage).toHaveBeenCalledWith('some-path/img.jpg');
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Imagen eliminada correctamente' });
        });

        it('should return 500 status with specific error message on delete failure', async () => {
            req.body = { publicId: 'some-path/img.jpg' };
            (globalThis as any).mockDeleteImage.mockRejectedValue(new Error('Delete error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminarImagen(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Delete error' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should return 500 status with fallback error message on delete failure without a message', async () => {
            req.body = { publicId: 'some-path/img.jpg' };
            (globalThis as any).mockDeleteImage.mockRejectedValue(new Error(''));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await controller.eliminarImagen(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({ message: 'Error al eliminar la imagen' });
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
