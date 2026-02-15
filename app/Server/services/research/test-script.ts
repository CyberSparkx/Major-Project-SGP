import { processResearchRequest } from './researchAgent';
import { generatePDFStream } from './pdfGenerator';
import * as fs from 'fs';
import * as path from 'path';

async function test() {
  console.log('Testing Research Service...');

  try {
    // Test 1: Simple Search
    console.log('\n--- 1. Testing Search on "Quantum Computing" ---');
    const result = await processResearchRequest({
      query: 'Latest breakthroughs in Quantum Computing 2024',
    });

    console.log('Title:', result.title);
    console.log('Summary:', result.summary);
    console.log('Key Points:', result.keyPoints);
    console.log('Sources:', result.sources);

    // Test 2: PDF Generation
    console.log('\n--- 2. Testing PDF Generation ---');
    if (result) {
      const stream = await generatePDFStream(result);
      const chunks: Uint8Array[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(path.join(__dirname, 'test-output.pdf'), buffer);
        console.log('PDF saved to test-output.pdf');
      });
    }
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

test();
