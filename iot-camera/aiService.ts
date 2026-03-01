import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');

/**
 * Analyze an image from a URL using Gemini Vision.
 * The user supplies a prompt describing what they want to know about the image.
 * @param imageUrl - Public Cloudinary URL of the image
 * @param userPrompt - What the user wants to know about the image
 * @returns AI-generated text response
 */
export async function analyzeImage(imageUrl: string, userPrompt: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });

        // Fetch the image as base64
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageData = Buffer.from(imageResponse.data as ArrayBuffer).toString('base64');
        const mimeType = (imageResponse.headers['content-type'] as string) ?? 'image/jpeg';

        const prompt = `
You are an intelligent image analysis assistant. The user has captured an image from an IoT camera and wants you to help them.

User's request: "${userPrompt}"

Please analyze the image carefully and respond to the user's request. If they want information about what's shown, describe it thoroughly. If they want to understand code, read text, identify objects, or research something related to the image — provide a detailed, helpful response.

Be specific, structured, and informative in your answer.
    `.trim();

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageData,
                    mimeType,
                },
            },
        ]);

        return result.response.text();
    } catch (error) {
        const err = error as Error;
        throw new Error(`AI analysis failed: ${err.message}`);
    }
}
