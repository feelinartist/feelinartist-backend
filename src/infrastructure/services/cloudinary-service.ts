import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { configService } from './config-service';

export class CloudinaryService {
    private initialized = false;

    private async initialize() {
        if (this.initialized) return;

        const cloudName = await configService.get('CLOUDINARY_CLOUD_NAME', 'djfkyim7a');
        const apiKey = await configService.get('CLOUDINARY_API_KEY', '432437845233632');
        const apiSecret = await configService.get('CLOUDINARY_API_SECRET', '0_n5LOyKrkZp69Vn0F7di7s1HCI');

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });

        this.initialized = true;
    }

    async uploadImage(imageBuffer: Buffer, folder: string = 'feelin'): Promise<string> {
        await this.initialize();
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: folder },
                (error: Error | undefined, result: UploadApiResponse | undefined) => {
                    if (error) return reject(error);
                    if (result) return resolve(result.secure_url);
                    reject(new Error('Cloudinary upload failed'));
                }
            );
            uploadStream.end(imageBuffer);
        });
    }

    /**
     * Upload base64 image to Cloudinary
     * @param base64Image - Base64 encoded image
     * @param folder - Folder path in Cloudinary
     * @param publicId - Optional public ID for the image
     */
    async uploadBase64Image(base64Image: string, folder: string, publicId?: string): Promise<Record<string, unknown>> {
        await this.initialize();
        try {
            const result = await cloudinary.uploader.upload(base64Image, {
                folder: folder,
                public_id: publicId,
                overwrite: true,
                resource_type: 'image'
            });

            return {
                url: result.secure_url,
                publicId: result.public_id
            };
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Error al subir la imagen');
        }
    }

    /**
     * Delete an image from Cloudinary
     * @param publicId - Public ID of the image to delete
     */
    async deleteImage(publicId: string): Promise<void> {
        await this.initialize();
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw new Error('Error al eliminar la imagen');
        }
    }

    /**
     * Delete multiple images from Cloudinary
     * @param publicIds - Array of public IDs to delete
     */
    async deleteImages(publicIds: string[]): Promise<void> {
        await this.initialize();
        try {
            await cloudinary.api.delete_resources(publicIds);
        } catch (error) {
            console.error('Error deleting images from Cloudinary:', error);
            throw new Error('Error al eliminar las imágenes');
        }
    }

    /**
     * Get folder path for user images
     * @param userId - User ID
     * @param type - Type of image (gallery, payment, profile)
     */
    getUserFolder(userId: string, type: 'gallery' | 'payment' | 'profile'): string {
        return `feelin/users/${userId}/${type}`;
    }
}

