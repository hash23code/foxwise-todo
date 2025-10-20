import { NextRequest, NextResponse } from 'next/server';

// GET weather forecast for a specific date and location
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const lat = searchParams.get('lat') || '45.5017'; // Montreal by default
  const lon = searchParams.get('lon') || '-73.5673';

  try {
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      // Return mock data if no API key (for development)
      return NextResponse.json(getMockWeatherData(date));
    }

    // Use OpenWeatherMap One Call API 3.0 for hourly forecast
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&lang=fr&appid=${apiKey}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('OpenWeather API error:', response.status, response.statusText);
      // Return mock data on error
      return NextResponse.json(getMockWeatherData(date));
    }

    const data = await response.json();

    // Get the requested date
    const requestDate = new Date(date);
    requestDate.setHours(0, 0, 0, 0);

    // Find forecasts for the requested date
    const dailyForecast = data.daily?.find((day: any) => {
      const forecastDate = new Date(day.dt * 1000);
      forecastDate.setHours(0, 0, 0, 0);
      return forecastDate.getTime() === requestDate.getTime();
    });

    // Get hourly forecasts for morning (8-12h), afternoon (12-18h), evening (18-23h)
    const hourlyForecasts = data.hourly?.filter((hour: any) => {
      const hourDate = new Date(hour.dt * 1000);
      hourDate.setHours(hourDate.getHours(), 0, 0, 0);
      const reqDate = new Date(date);
      return hourDate.toDateString() === reqDate.toDateString();
    });

    const morning = hourlyForecasts?.filter((h: any) => {
      const hour = new Date(h.dt * 1000).getHours();
      return hour >= 6 && hour < 12;
    })[0];

    const afternoon = hourlyForecasts?.filter((h: any) => {
      const hour = new Date(h.dt * 1000).getHours();
      return hour >= 12 && hour < 18;
    })[0];

    const evening = hourlyForecasts?.filter((h: any) => {
      const hour = new Date(h.dt * 1000).getHours();
      return hour >= 18 && hour < 24;
    })[0];

    const weatherData = {
      date,
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        name: data.timezone || 'Montreal',
      },
      daily: dailyForecast ? {
        temp: {
          min: Math.round(dailyForecast.temp.min),
          max: Math.round(dailyForecast.temp.max),
        },
        description: dailyForecast.weather[0].description,
        icon: dailyForecast.weather[0].icon,
        main: dailyForecast.weather[0].main,
        precipitation: dailyForecast.pop * 100, // Probability of precipitation
        humidity: dailyForecast.humidity,
        windSpeed: dailyForecast.wind_speed,
        clouds: dailyForecast.clouds,
      } : null,
      periods: {
        morning: morning ? {
          temp: Math.round(morning.temp),
          description: morning.weather[0].description,
          icon: morning.weather[0].icon,
          main: morning.weather[0].main,
          precipitation: morning.pop * 100,
          time: '6h-12h',
        } : null,
        afternoon: afternoon ? {
          temp: Math.round(afternoon.temp),
          description: afternoon.weather[0].description,
          icon: afternoon.weather[0].icon,
          main: afternoon.weather[0].main,
          precipitation: afternoon.pop * 100,
          time: '12h-18h',
        } : null,
        evening: evening ? {
          temp: Math.round(evening.temp),
          description: evening.weather[0].description,
          icon: evening.weather[0].icon,
          main: evening.weather[0].main,
          precipitation: evening.pop * 100,
          time: '18h-23h',
        } : null,
      },
      suitable: getSuitabilityInfo(dailyForecast, morning, afternoon, evening),
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Error in GET /api/weather:', error);
    // Return mock data on error
    return NextResponse.json(getMockWeatherData(date));
  }
}

// Determine if weather is suitable for outdoor activities
function getSuitabilityInfo(daily: any, morning: any, afternoon: any, evening: any) {
  const periods = { morning, afternoon, evening };
  const suitability: any = {};

  Object.entries(periods).forEach(([period, data]: [string, any]) => {
    if (!data) {
      suitability[period] = { suitable: true, reason: 'Données non disponibles' };
      return;
    }

    const main = data.weather?.[0]?.main || daily?.weather?.[0]?.main;
    const precipitation = data.pop * 100;
    const temp = data.temp || daily?.temp?.day;

    let suitable = true;
    let reason = 'Idéal pour activités extérieures';

    // Check rain/snow
    if (main === 'Rain' || main === 'Drizzle' || precipitation > 60) {
      suitable = false;
      reason = 'Pluie prévue - privilégier intérieur';
    } else if (main === 'Snow') {
      suitable = false;
      reason = 'Neige prévue - privilégier intérieur';
    } else if (main === 'Thunderstorm') {
      suitable = false;
      reason = 'Orage prévu - rester à l\'intérieur';
    }
    // Check extreme temperatures
    else if (temp < -10) {
      suitable = false;
      reason = 'Très froid - privilégier intérieur';
    } else if (temp > 35) {
      suitable = false;
      reason = 'Très chaud - privilégier intérieur';
    }
    // Moderate conditions
    else if (main === 'Clouds' || precipitation > 30) {
      suitable = true;
      reason = 'Conditions acceptables pour extérieur';
    }

    suitability[period] = { suitable, reason, main, precipitation, temp };
  });

  return suitability;
}

// Mock weather data for development/fallback
function getMockWeatherData(date: string) {
  const now = new Date();
  const hour = now.getHours();

  return {
    date,
    location: {
      lat: 45.5017,
      lon: -73.5673,
      name: 'Montreal',
    },
    daily: {
      temp: { min: 5, max: 18 },
      description: 'partiellement nuageux',
      icon: '02d',
      main: 'Clouds',
      precipitation: 20,
      humidity: 65,
      windSpeed: 15,
      clouds: 40,
    },
    periods: {
      morning: {
        temp: 12,
        description: 'quelques nuages',
        icon: '02d',
        main: 'Clouds',
        precipitation: 10,
        time: '6h-12h',
      },
      afternoon: {
        temp: 18,
        description: 'partiellement nuageux',
        icon: '03d',
        main: 'Clouds',
        precipitation: 20,
        time: '12h-18h',
      },
      evening: {
        temp: 14,
        description: 'ciel dégagé',
        icon: '01n',
        main: 'Clear',
        precipitation: 5,
        time: '18h-23h',
      },
    },
    suitable: {
      morning: { suitable: true, reason: 'Idéal pour activités extérieures', main: 'Clouds', precipitation: 10, temp: 12 },
      afternoon: { suitable: true, reason: 'Conditions acceptables pour extérieur', main: 'Clouds', precipitation: 20, temp: 18 },
      evening: { suitable: true, reason: 'Idéal pour activités extérieures', main: 'Clear', precipitation: 5, temp: 14 },
    },
  };
}
