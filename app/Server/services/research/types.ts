export interface ResearchRequest {
  query?: string;
  image?: string; // base64 or url
  instruction?: string; // e.g. "Research this topic" or "Generate caption" or "Auto"
  exportPdf?: boolean;
}

export interface ResearchResult {
  title: string;
  summary: string;
  keyPoints?: string[];
  sources: { title: string; link: string }[];
  content: string; // The full detailed report
  pdfBuffer?: Buffer;
}

export interface PDFOptions {
  title: string;
  author?: string;
  subject?: string;
}
