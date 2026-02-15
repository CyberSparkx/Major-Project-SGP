import axios from 'axios';

export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  pressure: number;
  humidity: number;
  description: string;
  windSpeed: number;
  cloudiness: number;
  visibility: number;
  sunrise: number;
  sunset: number;
}

export interface AQIData {
  aqi: number; // Air Quality Index (US EPA standard: 1-6)
  components: {
    co: number; // Carbon monoxide (μg/m³)
    no: number; // Nitrogen monoxide (μg/m³)
    no2: number; // Nitrogen dioxide (μg/m³)
    o3: number; // Ozone (μg/m³)
    so2: number; // Sulphur dioxide (μg/m³)
    pm2_5: number; // PM2.5 (μg/m³)
    pm10: number; // PM10 (μg/m³)
    nh3: number; // Ammonia (μg/m³)
  };
}

export interface WeatherResponse {
  weather: WeatherData;
  airQuality: AQIData;
}

export class WeatherService {
  private static BASE_URL = 'https://api.weatherapi.com/v1';

  static async fetchWeather(location: string): Promise<WeatherResponse> {
    if (!location) {
      throw new Error('Location is required');
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error(
        'WEATHER_API_KEY is not defined in environment variables'
      );
    }

    try {
      // WeatherAPI.com provides weather + AQI in a single call
      const response = await axios.get(`${this.BASE_URL}/current.json`, {
        params: {
          key: apiKey,
          q: location,
          aqi: 'yes', // Include air quality data
        },
      });

      const { location: loc, current } = response.data;

      // Calculate approximate sunrise/sunset (WeatherAPI doesn't provide in current endpoint)
      const now = new Date();
      const sunrise = new Date(now);
      sunrise.setHours(6, 0, 0, 0);
      const sunset = new Date(now);
      sunset.setHours(18, 0, 0, 0);

      const weatherData: WeatherData = {
        location: loc.name,
        country: loc.country,
        temperature: Math.round(current.temp_c),
        feelsLike: Math.round(current.feelslike_c),
        tempMin: Math.round(current.temp_c - 2), // Approximation
        tempMax: Math.round(current.temp_c + 2), // Approximation
        pressure: current.pressure_mb,
        humidity: current.humidity,
        description: current.condition.text,
        windSpeed: current.wind_kph / 3.6, // Convert kph to m/s
        cloudiness: current.cloud,
        visibility: current.vis_km * 1000, // Convert km to meters
        sunrise: Math.floor(sunrise.getTime() / 1000),
        sunset: Math.floor(sunset.getTime() / 1000),
      };

      const airQuality: AQIData = {
        aqi: current.air_quality['us-epa-index'],
        components: {
          co: current.air_quality.co,
          no: 0, // WeatherAPI doesn't provide NO separately
          no2: current.air_quality.no2,
          o3: current.air_quality.o3,
          so2: current.air_quality.so2,
          pm2_5: current.air_quality.pm2_5,
          pm10: current.air_quality.pm10,
          nh3: 0, // WeatherAPI doesn't provide NH3
        },
      };

      return {
        weather: weatherData,
        airQuality: airQuality,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // WeatherAPI.com returns 400 for location not found
        if (error.response?.status === 400) {
          throw new Error(`Location "${location}" not found`);
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Invalid API key or API access denied');
        }
        console.error(
          'WeatherAPI Error:',
          error.response?.data || error.message
        );
      } else {
        console.error('Error fetching weather:', error);
      }
      throw new Error('Failed to fetch weather data');
    }
  }
}
