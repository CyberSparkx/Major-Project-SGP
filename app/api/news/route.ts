import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '../../Server/services/newsService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get('topic');

  if (!topic) {
    return NextResponse.json(
      { error: 'Topic query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const { summary, articles } = await NewsService.fetchNews(topic);
    return NextResponse.json({
      topic,
      summary,
      news: articles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
