import { NextRequest } from 'next/server';
import { POST } from './route';
import {
  processResearchRequest,
  generatePDFStream,
} from '../../Server/services/research';
import { Readable } from 'stream';

jest.mock('../../Server/services/research', () => ({
  processResearchRequest: jest.fn(),
  generatePDFStream: jest.fn(),
}));

const mockedProcess = processResearchRequest as jest.Mock;
const mockedGeneratePDF = generatePDFStream as jest.Mock;

describe('Research API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle JSON request and return research results', async () => {
    const mockResult = {
      title: 'Test Research',
      summary: 'Summary',
      content: 'Content',
      sources: [],
    };
    mockedProcess.mockResolvedValue(mockResult);

    const request = new NextRequest('http://localhost:3000/api/research', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Research');
    expect(mockedProcess).toHaveBeenCalledWith({ query: 'test' });
  });

  it('should handle multipart/form-data request with image', async () => {
    mockedProcess.mockResolvedValue({
      title: 'Image Result',
      summary: '...',
      content: '...',
      sources: [],
    });

    const formData = new FormData();
    formData.append('query', 'What is this?');
    formData.append(
      'image',
      new Blob(['fake-image-data'], { type: 'image/png' })
    );

    const request = new NextRequest('http://localhost:3000/api/research', {
      method: 'POST',
      body: formData,
      // NextJS NextRequest handles the boundary automatically for FormData
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockedProcess).toHaveBeenCalled();
    const callArgs = mockedProcess.mock.calls[0][0];
    expect(callArgs.query).toBe('What is this?');
    expect(callArgs.image).toBeDefined();
  });

  it('should return PDF stream when exportPdf is true', async () => {
    mockedProcess.mockResolvedValue({
      title: 'PDF Report',
      summary: '...',
      content: '...',
      sources: [],
    });

    const mockStream = new Readable();
    mockStream.push('fake-pdf-content');
    mockStream.push(null);
    mockedGeneratePDF.mockResolvedValue(mockStream);

    const request = new NextRequest('http://localhost:3000/api/research', {
      method: 'POST',
      body: JSON.stringify({ query: 'pdf test', exportPdf: true }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'pdf_report.pdf'
    );
  });

  it('should return 500 on service failure', async () => {
    mockedProcess.mockRejectedValue(new Error('Internal breakdown'));

    const request = new NextRequest('http://localhost:3000/api/research', {
      method: 'POST',
      body: JSON.stringify({ query: 'fail' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal breakdown');
  });
});
