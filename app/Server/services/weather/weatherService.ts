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
  /**
   * Unix timestamp (seconds) of sunrise time for the location's date.
   * Fetched from WeatherAPI's forecast endpoint for accuracy.
   */
  sunrise: number;
  /**
   * Unix timestamp (seconds) of sunset time for the location's date.
   * Fetched from WeatherAPI's forecast endpoint for accuracy.
   */
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

      // Fetch forecast data to get accurate sunrise/sunset times
      let sunrise: Date;
      let sunset: Date;
      try {
        const forecastResponse = await axios.get(
          `${this.BASE_URL}/forecast.json`,
          {
            params: {
              key: apiKey,
              q: location,
              days: 1,
              aqi: 'no',
            },
          }
        );

        const astro = forecastResponse.data.forecast.forecastday[0].astro;
        // Parse sunrise/sunset from WeatherAPI format (e.g., "06:30 AM")
        sunrise = this.parseTimeToDate(astro.sunrise);
        sunset = this.parseTimeToDate(astro.sunset);
      } catch (error) {
        // Fallback to approximate times if forecast call fails
        console.warn(
          'Failed to fetch forecast data for sunrise/sunset, using approximation'
        );
        const now = new Date();
        sunrise = new Date(now);
        sunrise.setHours(6, 0, 0, 0);
        sunset = new Date(now);
        sunset.setHours(18, 0, 0, 0);
      }

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

  /**
   * Parses WeatherAPI time format (e.g., "06:30 AM") to a Date object.
   * Uses today's date and assumes the time is in the location's timezone.
   */
  private static parseTimeToDate(timeStr: string): Date {
    const date = new Date();
    // WeatherAPI returns time in format "HH:MM AM/PM"
    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);

    if (!timeParts) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    let hours = parseInt(timeParts[1], 10);
    const minutes = parseInt(timeParts[2], 10);
    const period = timeParts[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    date.setHours(hours, minutes, 0, 0);
    return date;
  }
}
