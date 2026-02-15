import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '../../Server/services/weather/weatherService';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json(
      { error: 'Location query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const { weather, airQuality } = await WeatherService.fetchWeather(location);
    return NextResponse.json({
      location: weather.location,
      country: weather.country,
      weather,
      airQuality,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch weather data';

    // Return 404 if location not found
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
