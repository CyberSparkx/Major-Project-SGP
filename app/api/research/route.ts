import { NextRequest, NextResponse } from 'next/server';
import {
  processResearchRequest,
  generatePDFStream,
  ResearchRequest,
} from '../../Server/services/research';

export const maxDuration = 60; // Set timeout to 60s for long research tasks

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let researchRequest: ResearchRequest;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const query = formData.get('query') as string | undefined;
      const instruction = formData.get('instruction') as string | undefined;
      const exportPdf = formData.get('exportPdf') === 'true';
      const imageFile = formData.get('image') as File | null;

      let imageBase64: string | undefined = undefined;
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageBase64 = buffer.toString('base64');
      }

      researchRequest = {
        query,
        instruction,
        exportPdf,
        image: imageBase64,
      };
    } else {
      researchRequest = await req.json();
    }

    const result = await processResearchRequest(researchRequest);

    if (researchRequest.exportPdf) {
      const stream = await generatePDFStream(result);

      // Create a web ReadableStream from the NodeJS stream
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(webStream, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Research API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
