import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');

const INTERNAL_WS_URL = process.env.WS_INTERNAL_URL ?? 'http://localhost:3002';

/**
 * Notify the WS server to broadcast the AI analysis result to browser clients.
 */
async function notifyWsAnalysis(result: string): Promise<void> {
    try {
        await fetch(`${INTERNAL_WS_URL}/internal/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result }),
        });
    } catch {
        // Non-fatal
    }
}

/**
 * POST /api/iot/analyze
 *
 * BROWSER calls this after the image has been received.
 * Body: { imageUrl: string, prompt: string }
 * Returns: { result: string }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const body = (await req.json()) as { imageUrl?: string; prompt?: string };
        const { imageUrl, prompt } = body;

        if (!imageUrl || !prompt) {
            return NextResponse.json(
                { error: 'Both imageUrl and prompt are required.' },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });

        // Fetch the image and convert to base64
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            return NextResponse.json(
                { error: 'Could not fetch the image from the provided URL.' },
                { status: 422 }
            );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType =
            imageResponse.headers.get('content-type') ?? 'image/jpeg';

        const systemPrompt = `
You are an intelligent image analysis assistant connected to an IoT camera.
The user captured a photo and wants: "${prompt}"

Analyze the image thoroughly. If it shows code, read and explain it. If it shows a product, describe and research it. If it shows text, transcribe and explain. If asked to search online, provide your best knowledge about the topic shown.

Provide a well-structured, detailed and helpful response.
    `.trim();

        const result = await model.generateContent([
            systemPrompt,
            { inlineData: { data: base64Image, mimeType } },
        ]);

        const responseText = result.response.text();

        // Also broadcast the result to browser via WS (optional, for real-time)
        await notifyWsAnalysis(responseText);

        return NextResponse.json({ result: responseText });
    } catch (error) {
        console.error('[AI Analyze] Error:', error);
        return NextResponse.json(
            { error: (error as Error).message ?? 'Analysis failed' },
            { status: 500 }
        );
    }
}
