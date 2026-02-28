/**
 * Tests for POST /api/iot/analyze
 *
 * We mock @google/generative-ai and the internal WS call.
 * The test validates request validation and the happy path.
 */

import { POST } from '@/app/api/iot/analyze/route';
import { NextRequest } from 'next/server';

// ── Mock Gemini ───────────────────────────────────────────────────────────────
// Keep a stable reference to the mock so we can inspect calls in tests.
const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
        text: () => 'This image shows a React component with useState hook.',
    },
});
const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
});

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
    })),
    HarmCategory: { HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT' },
    HarmBlockThreshold: { BLOCK_NONE: 'BLOCK_NONE' },
}));

// ── Mock fetch (image download + internal WS notify) ─────────────────────────
global.fetch = jest.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('cloudinary')) {
        // Simulates downloading the image from Cloudinary
        return Promise.resolve({
            ok: true,
            headers: { get: () => 'image/jpeg' },
            arrayBuffer: async () => new Uint8Array([0xff, 0xd8]).buffer,
        });
    }
    // internal WS server call
    return Promise.resolve({ ok: true });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAnalyzeRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost:3000/api/iot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/iot/analyze', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 when imageUrl is missing', async () => {
        const req = makeAnalyzeRequest({ prompt: 'What is this?' });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json() as { error: string };
        expect(data.error).toMatch(/imageUrl/);
    });

    it('returns 400 when prompt is missing', async () => {
        const req = makeAnalyzeRequest({
            imageUrl: 'https://res.cloudinary.com/test/image.jpg',
        });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json() as { error: string };
        expect(data.error).toMatch(/prompt/);
    });

    it('returns 400 when both imageUrl and prompt are missing', async () => {
        const req = makeAnalyzeRequest({});
        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns AI analysis result on valid input', async () => {
        const req = makeAnalyzeRequest({
            imageUrl: 'https://res.cloudinary.com/test/image.jpg',
            prompt: 'Explain the code in this image',
        });

        const res = await POST(req);
        const data = await res.json() as { result: string };

        expect(res.status).toBe(200);
        expect(data.result).toBe('This image shows a React component with useState hook.');
    });

    it('returns 422 when image URL cannot be fetched', async () => {
        // Override fetch to simulate failed image download
        (global.fetch as jest.Mock).mockImplementationOnce(() =>
            Promise.resolve({ ok: false })
        );

        const req = makeAnalyzeRequest({
            imageUrl: 'https://bad-url.com/broken.jpg',
            prompt: 'What is this?',
        });

        const res = await POST(req);
        expect(res.status).toBe(422);
        const data = await res.json() as { error: string };
        expect(data.error).toMatch(/fetch/i);
    });

    it('calls Gemini with the correct prompt and image data', async () => {
        // Reset mock call history (not the implementation)
        mockGenerateContent.mockClear();
        mockGetGenerativeModel.mockClear();

        const req = makeAnalyzeRequest({
            imageUrl: 'https://res.cloudinary.com/test/image.jpg',
            prompt: 'Describe this image',
        });

        await POST(req);

        // getGenerativeModel and generateContent should each have been called once
        expect(mockGetGenerativeModel).toHaveBeenCalledTimes(1);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);

        // generateContent is called with an array; first element is the system prompt
        const callArgs = mockGenerateContent.mock.calls[0][0] as unknown[];
        expect(typeof callArgs[0]).toBe('string');
        // Second element contains inlineData with the base64 image
        expect(callArgs[1]).toHaveProperty('inlineData');
    });
});

