import { GET } from './route';
import { NextRequest } from 'next/server';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.isAxiosError to recognize our test errors
axios.isAxiosError = jest.fn((error: unknown) => {
  return !!error && (error as { isAxiosError: boolean }).isAxiosError === true;
}) as unknown as typeof axios.isAxiosError;

describe('/api/weather', () => {
  const mockWeatherResponse = {
    data: {
      location: {
        name: 'London',
        region: 'City of London, Greater London',
        country: 'United Kingdom',
      },
      current: {
        temp_c: 12.5,
        feelslike_c: 11.2,
        condition: { text: 'Partly cloudy' },
        wind_kph: 16.2,
        pressure_mb: 1013,
        humidity: 76,
        cloud: 25,
        vis_km: 10,
        uv: 3,
        last_updated: '2024-02-15 12:00',
        air_quality: {
          'us-epa-index': 2,
          pm2_5: 12.5,
          pm10: 18.3,
          co: 230.5,
          no2: 15.2,
          o3: 45.8,
          so2: 3.2,
        },
      },
    },
  };

  const originalApiKey = process.env.WEATHER_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEATHER_API_KEY = 'test-api-key';
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Restore original API key
    if (originalApiKey !== undefined) {
      process.env.WEATHER_API_KEY = originalApiKey;
    } else {
      delete process.env.WEATHER_API_KEY;
    }
  });

  it('should return weather data for a valid location', async () => {
    mockedAxios.get.mockResolvedValueOnce(mockWeatherResponse);

    const request = new NextRequest(
      'http://localhost:3000/api/weather?location=London'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.location).toBe('London');
    expect(data.country).toBe('United Kingdom');
    expect(data.weather).toBeDefined();
    expect(data.weather.temperature).toBe(13); // rounded from 12.5
    expect(data.weather.description).toBe('Partly cloudy');
    expect(data.airQuality).toBeDefined();
    expect(data.airQuality.aqi).toBe(2);
    expect(data.airQuality.components.pm2_5).toBe(12.5);
  });

  it('should return 400 if location parameter is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/weather');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Location query parameter is required');
  });

  it('should return 404 if location is not found', async () => {
    const axiosError = Object.assign(new Error('Location not found'), {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: {
            code: 1006,
            message: 'No matching location found.',
          },
        },
      },
      toJSON: () => ({}),
    });

    mockedAxios.get.mockRejectedValueOnce(axiosError);

    const request = new NextRequest(
      'http://localhost:3000/api/weather?location=InvalidCity123'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('not found');
  });

  it('should return 500 on service failure', async () => {
    const networkError = Object.assign(new Error('Network error'), {
      isAxiosError: true,
      response: undefined,
    });

    mockedAxios.get.mockRejectedValueOnce(networkError);

    const request = new NextRequest(
      'http://localhost:3000/api/weather?location=London'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch weather data');
  });

  it('should return 500 if API key is missing', async () => {
    delete process.env.WEATHER_API_KEY;

    const request = new NextRequest(
      'http://localhost:3000/api/weather?location=London'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('WEATHER_API_KEY');
  });
});
