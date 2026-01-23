import { Request, Response } from 'express';
import { CloudinaryService } from '../../infrastructure/services/cloudinary-service';

const cloudinaryService = new CloudinaryService();

export class ControladorImagenes {
    /**
     * Upload gallery images for an artist
     * POST /api/imagenes/galeria
     * Body: { usuarioId: string, images: string[] } // base64 images
     */
    async subirImagenesGaleria(req: Request, res: Response) {
        try {
            const { usuarioId, images } = req.body;

            if (!usuarioId || !images || !Array.isArray(images)) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const folder = cloudinaryService.getUserFolder(usuarioId, 'gallery');
            const uploadedImages = [];

            for (let i = 0; i < images.length; i++) {
                const result = await cloudinaryService.uploadBase64Image(
                    images[i],
                    folder,
                    `image_${Date.now()}_${i}`
                );
                uploadedImages.push(result.url);
            }

            res.json({ urls: uploadedImages });
        } catch (error) {
            console.error('Error uploading gallery images:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al subir las imágenes' });
        }
    }

    /**
     * Upload payment QR for an artist
     * POST /api/imagenes/qr-pago
     * Body: { usuarioId: string, image: string } // base64 image
     */
    async subirQRPago(req: Request, res: Response) {
        try {
            const { usuarioId, image } = req.body;

            if (!usuarioId || !image) {
                return res.status(400).json({ message: 'Datos inválidos' });
            }

            const folder = cloudinaryService.getUserFolder(usuarioId, 'payment');
            const result = await cloudinaryService.uploadBase64Image(
                image,
                folder,
                'qr_payment'
            );

            res.json({ url: result.url });
        } catch (error) {
            console.error('Error uploading payment QR:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al subir el QR' });
        }
    }

    /**
     * Delete an image from Cloudinary
     * DELETE /api/imagenes
     * Body: { publicId: string }
     */
    async eliminarImagen(req: Request, res: Response) {
        try {
            const { publicId } = req.body;

            if (!publicId) {
                return res.status(400).json({ message: 'Public ID requerido' });
            }

            await cloudinaryService.deleteImage(publicId);
            res.json({ message: 'Imagen eliminada correctamente' });
        } catch (error) {
            console.error('Error deleting image:', error);
            res.status(500).json({ message: (error as Error).message || 'Error al eliminar la imagen' });
        }
    }
}
