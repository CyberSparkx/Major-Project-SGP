import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Fetches and extracts main text content from a URL.
 */
export async function scrapeContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 5000, // 5 seconds timeout
    });

    const $ = cheerio.load(response.data);

    // Remove unwanted elements
    $('script, style, nav, footer, iframe, ads, .ad, .advertisement').remove();

    // extract text from paragraphs
    const paragraphs: string[] = [];
    $('p').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 50) {
        // Filter out short snippets
        paragraphs.push(text);
      }
    });

    return paragraphs.join('\n\n');
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return '';
  }
}
