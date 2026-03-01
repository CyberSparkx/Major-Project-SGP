/**
 * Tests for GET /api/iot/upload (status polling) and POST /api/iot/upload (IoT image upload).
 *
 * We mock Cloudinary and the internal WS server HTTP call so no external services are hit.
 */

import { GET, POST } from '@/app/api/iot/upload/route';
import { iotState, setFlag, setLastImage } from '@/app/Server/iot/flagStore';
import { NextRequest } from 'next/server';

// ── Mock Cloudinary ────────────────────────────────────────────────────────────
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload_stream: jest.fn(
                (
                    _opts: unknown,
                    callback: (err: null, result: { secure_url: string; public_id: string }) => void
                ) => {
                    // Simulate a successful upload by calling callback asynchronously
                    const stream = {
                        end: (buf: Buffer) => {
                            // Make sure we received a buffer
                            expect(buf).toBeInstanceOf(Buffer);
                            callback(null, {
                                secure_url: 'https://res.cloudinary.com/test/image/upload/iot-camera/test.jpg',
                                public_id: 'iot-camera/test',
                            });
                        },
                    };
                    return stream;
                }
            ),
            destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
        },
    },
}));

// ── Mock internal WS HTTP call ────────────────────────────────────────────────
global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });

// ── Helpers ───────────────────────────────────────────────────────────────────

async function makeUploadRequest(imageBytes: Uint8Array): Promise<NextRequest> {
    const formData = new FormData();
    const blob = new Blob([imageBytes.buffer as ArrayBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'photo.jpg');

    return new NextRequest('http://localhost:3000/api/iot/upload', {
        method: 'POST',
        body: formData,
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/iot/upload', () => {
    beforeEach(() => {
        setFlag(0);
    });

    it('returns current flag and imageUrl', async () => {
        const res = await GET();
        const data = await res.json() as { flag: number; imageUrl: string | null };
        expect(res.status).toBe(200);
        expect(data).toHaveProperty('flag');
        expect(data).toHaveProperty('imageUrl');
    });

    it('reflects the latest image URL', async () => {
        setLastImage('https://example.com/photo.jpg', 'iot-camera/photo');
        const res = await GET();
        const data = await res.json() as { imageUrl: string };
        expect(data.imageUrl).toBe('https://example.com/photo.jpg');
    });
});

describe('POST /api/iot/upload', () => {
    beforeEach(() => {
        setFlag(1); // flag must be 1 (capture requested) when IoT uploads
        jest.clearAllMocks();
        global.fetch = jest.fn().mockResolvedValue({ ok: true });
    });

    it('returns 400 when no image field is provided', async () => {
        const formData = new FormData();
        const req = new NextRequest('http://localhost:3000/api/iot/upload', {
            method: 'POST',
            body: formData,
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json() as { error: string };
        expect(data.error).toMatch(/No image file found/);
    });

    it('uploads the image, resets flag to 0, and returns imageUrl', async () => {
        // Tiny 1×1 JPEG bytes (valid minimal JPEG header)
        const fakeJpeg = new Uint8Array([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
        ]);
        const req = await makeUploadRequest(fakeJpeg);
        const res = await POST(req);
        const data = await res.json() as { success: boolean; imageUrl: string };

        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.imageUrl).toBe(
            'https://res.cloudinary.com/test/image/upload/iot-camera/test.jpg'
        );
        expect(iotState.flag).toBe(0); // flag must be reset
    });

    it('deletes the previous Cloudinary image when one exists', async () => {
        const { v2: cloudinary } = await import('cloudinary');

        // Set a previous image
        setLastImage('https://old.url/image.jpg', 'iot-camera/old-image');

        const fakeJpeg = new Uint8Array([0xff, 0xd8]);
        const req = await makeUploadRequest(fakeJpeg);
        await POST(req);

        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('iot-camera/old-image');
    });
});
