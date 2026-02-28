import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (one level up from iot-camera/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
    url: string;
    publicId: string;
}

/**
 * Upload a raw image buffer to Cloudinary.
 * @param buffer - The image data as a Buffer
 * @returns The secure URL and public_id of the uploaded image
 */
export async function uploadImage(buffer: Buffer): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'iot-camera',
                resource_type: 'image',
                format: 'jpg',
            },
            (error, result) => {
                if (error || !result) {
                    return reject(error ?? new Error('Cloudinary upload failed'));
                }
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Delete a previously uploaded image from Cloudinary by its public_id.
 * @param publicId - The Cloudinary public_id of the image
 */
export async function deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
}
