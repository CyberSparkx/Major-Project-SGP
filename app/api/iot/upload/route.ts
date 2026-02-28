import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { iotState, setFlag, setLastImage, clearLastImage } from '@/app/Server/iot/flagStore';

// Configure Cloudinary (safe to call multiple times — idempotent)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const INTERNAL_WS_URL = process.env.WS_INTERNAL_URL ?? 'http://localhost:3002';

/**
 * Notify the standalone WebSocket server to broadcast the new image URL
 * to all connected browser clients.
 */
async function notifyWsServer(payload: Record<string, unknown>): Promise<void> {
    try {
        await fetch(`${INTERNAL_WS_URL}/internal/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        // Non-fatal: browser will still get the URL on next poll if WS isn't running
        console.warn('[IoT Upload] Could not reach WS server:', (err as Error).message);
    }
}

/**
 * Upload a buffer to Cloudinary and return { url, publicId }.
 */
async function uploadToCloudinary(
    buffer: Buffer
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'iot-camera', resource_type: 'image', format: 'jpg' },
            (error, result) => {
                if (error || !result) return reject(error ?? new Error('Upload failed'));
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });
}

/**
 * POST /api/iot/upload
 *
 * IOT DEVICE sends the captured image here as multipart/form-data.
 * Field name: "image"
 *
 * Example Arduino/ESP32 code:
 *   camera_fb_t *fb = esp_camera_fb_get();
 *   http.begin(uploadURL);
 *   http.addHeader("Content-Type", "multipart/form-data; boundary=...");
 *   http.POST(... multipart body containing fb->buf ...);
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const formData = await req.formData();
        const file = formData.get('image');

        if (!file || typeof file === 'string') {
            return NextResponse.json(
                { error: 'No image file found. Send multipart/form-data with field "image".' },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Delete old image from Cloudinary if one exists
        if (iotState.lastPublicId) {
            try {
                await cloudinary.uploader.destroy(iotState.lastPublicId);
                console.log(`[IoT Upload] Deleted old image: ${iotState.lastPublicId}`);
            } catch {
                console.warn('[IoT Upload] Could not delete old image (may already be gone)');
            }
            clearLastImage();
        }

        // 2. Upload new image to Cloudinary
        const { url, publicId } = await uploadToCloudinary(buffer);
        console.log(`[IoT Upload] Uploaded: ${url}`);

        // 3. Save new image info in state
        setLastImage(url, publicId);

        // 4. Reset flag to 0 so the button re-enables
        setFlag(0);
        console.log('[IoT Upload] Flag reset to 0 — ready for next capture');

        // 5. Notify the WebSocket server to broadcast to browser
        await notifyWsServer({ imageUrl: url, publicId });

        return NextResponse.json({ success: true, imageUrl: url });
    } catch (error) {
        console.error('[IoT Upload] Error:', error);
        return NextResponse.json(
            { error: (error as Error).message ?? 'Upload failed' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/iot/upload
 * Lets the browser poll for the current image URL (fallback if WS isn't connected).
 */
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({
        flag: iotState.flag,
        imageUrl: iotState.lastImageUrl,
    });
}
