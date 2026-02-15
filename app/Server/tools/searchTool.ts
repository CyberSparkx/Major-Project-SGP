import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

/**
 * Perform a search on Wikipedia as a fallback.
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent':
          'CyberSparkx-Research-Tool/1.0 (https://github.com/CyberSparkx/Major-Project-SGP)',
      },
    });
    const [, titles, snippets, links] = response.data;

    const results: SearchResult[] = [];
    for (let i = 0; i < titles.length; i++) {
      results.push({
        title: titles[i],
        link: links[i],
        snippet: snippets[i],
        source: 'Wikipedia',
      });
    }
    return results;
  } catch (error) {
    console.error('Wikipedia search error:', error);
    return [];
  }
}

/**
 * Perform a web search using a public search engine interface (simulated/scraped).
 * Limitation: Without a paid API (Google/Bing), we rely on scraping public search result pages (DuckDuckGo HTML).
 * This is fragile but works for demonstration/hackathon purposes.
 */
export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    // DuckDuckGo HTML version is easier to scrape than standard Google
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, element) => {
      if (results.length >= 5) return; // Limit to 5 results

      const title = $(element).find('.result__title a').text().trim();
      const link = $(element).find('.result__title a').attr('href');
      const snippet = $(element).find('.result__snippet').text().trim();

      if (title && link && snippet) {
        results.push({
          title,
          link,
          snippet,
          source: new URL(link, 'https://duckduckgo.com').hostname,
        });
      }
    });

    console.log(
      `DuckDuckGo returned ${results.length} results for query: "${query}"`
    );

    if (results.length === 0) {
      console.log('Attempting Wikipedia fallback...');
      return await searchWikipedia(query);
    }

    return results;
  } catch (error) {
    console.error('Search tool error. Attempting Wikipedia fallback...', error);
    return await searchWikipedia(query);
  }
}
