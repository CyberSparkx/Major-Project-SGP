import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchWeb } from '../../tools/searchTool';
import { scrapeContent } from '../../tools/scraperTool';
import { ResearchRequest, ResearchResult } from './types';

const apiKey = process.env.GOOGLE_API_KEY;
export async function processResearchRequest(
  request: ResearchRequest
): Promise<ResearchResult> {
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not defined');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  let topic = request.query;

  // 1. Handle Image Input
  if (request.image) {
    // Assuming request.image is base64 without prefix data:image/...
    // If it has prefix, we need to strip it or handle it.
    // Let's assume standard base64 for now, but safer to check.

    // For simplicity, let's assume the user sends the part after "base64,"
    const visionModel = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });

    // Check if user specifically asked for caption or research
    // If instruction is "Generate caption", force caption.
    // If instruction is "Research", force research.
    // Else, ask model.

    const prompt = `
      Analyze this image. The user might want a creative caption or research about the subject.
      User instruction: "${request.instruction || ''}"
      
      If the user wants a caption, output JSON: {"type": "caption", "content": "The caption..."}
      If the user wants research (or the image implies a topic to be researched, like a landmark or complex diagram), output JSON: {"type": "research", "topic": "The exact topic to search for"}
      
      Decide based on the image and instruction. Default to research if ambiguous but contains information. Default to caption if it's "just a photo" and no query provided.
    `;

    // We need to convert base64 string to Part object
    const imagePart = {
      inlineData: {
        data: request.image,
        mimeType: request.image.startsWith('iVBORw0')
          ? 'image/png'
          : 'image/jpeg',
      },
    };

    try {
      const result = await visionModel.generateContent([prompt, imagePart]);
      const text = result.response.text();
      // Clean markdown json
      const cleanJson = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const decision = JSON.parse(cleanJson);

      console.log('Vision Decision:', decision);
      if (decision.type === 'caption') {
        return {
          title: 'Image Caption',
          summary: decision.content,
          content: decision.content,
          sources: [],
        };
      } else {
        topic = decision.topic;
        console.log('Analyzed Image Topic:', topic);
      }
    } catch (e) {
      console.error('Image analysis failed', e);
      // Fallback: if query exists, use it. Else fail.
      if (!topic)
        throw new Error(
          'Could not understand image and no text query provided.'
        );
    }
  }

  if (!topic) {
    throw new Error('No query provided for research.');
  }

  // 2. Search Phase
  console.log(`Searching for: ${topic}`);
  const searchResults = await searchWeb(topic);

  if (searchResults.length === 0) {
    console.warn(
      'No search results found (even via fallback). Synthesizing empty report.'
    );
  } else {
    console.log(`Analyzing ${searchResults.length} sources for synthesis...`);
  }

  // 3. Scrape Phase
  // Pick top 3 unique domains to avoid duplicates
  const sourcesToScrape = searchResults.slice(0, 4);
  const scrapedData: { url: string; content: string }[] = [];

  for (const source of sourcesToScrape) {
    try {
      const content = await scrapeContent(source.link);
      if (content.length > 200) {
        scrapedData.push({ url: source.link, content });
      }
    } catch {
      console.log(`Skipping ${source.link}`);
    }
  }

  // 4. Synthesis Phase
  const context = scrapedData
    .map(
      (d, i) => `Source ${i + 1} (${d.url}):\n${d.content.substring(0, 5000)}`
    )
    .join('\n\n'); // Limit context window

  const researchPrompt = `
    You are a professional research assistant.
    Topic: "${topic}"
    
    Based ONLY on the provided sources (and your general knowledge to fill gaps but prioritize sources), create a comprehensive research report.
    
    Structure:
    1. Title: A clear, professional title.
    2. Executive Summary: A concise summary of the findings (approx 200 words).
    3. Key Points: List of 3-5 crucial facts or insights.
    4. Detailed Analysis: A deep dive into the topic. Structure this with clear paragraphs. Expected length: 400-600 words.
    
    Sources Provided:
    ${context}
    
    Output Format: JSON only. Do NOT provide any conversational text before or after the JSON block. If no sources were provided, use your internal knowledge to provide a general report but mention the lack of specific sources in the executive summary.
    
    Expected JSON Structure:
    {
      "title": "...",
      "summary": "...",
      "keyPoints": ["...", "..."],
      "content": "..."
    }
  `;

  const result = await model.generateContent(researchPrompt);
  const responseText = result.response.text();

  // Improved JSON extraction: Find the first '{' and last '}' to handle conversational prefixes
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const cleanResponse = jsonMatch ? jsonMatch[0] : responseText;

  try {
    const json = JSON.parse(cleanResponse);
    return {
      title: json.title || 'Research Report',
      summary: json.summary,
      keyPoints: json.keyPoints,
      content: json.content,
      sources: searchResults.map((s) => ({ title: s.title, link: s.link })),
    };
  } catch (e) {
    console.error('Failed to parse research result', e);
    // Fallback
    return {
      title: `Research: ${topic}`,
      summary: 'Failed to generate structured report.',
      content: responseText,
      sources: searchResults.map((s) => ({ title: s.title, link: s.link })),
    };
  }
}
