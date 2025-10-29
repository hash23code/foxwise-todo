import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

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
      console.error('OpenWeather API key not found. Using mock data.');
      return NextResponse.json(getMockWeatherData(date));
    }

    // Step 1: Get current weather for location name
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;

    // Step 2: Get 5-day forecast (free tier)
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${apiKey}`;

    console.log('Fetching real weather from OpenWeather API...');

    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(currentWeatherUrl, { cache: 'no-store' }),
      fetch(forecastUrl, { cache: 'no-store' })
    ]);

    if (!currentResponse.ok || !forecastResponse.ok) {
      console.error('OpenWeather API error:', {
        current: currentResponse.status,
        forecast: forecastResponse.status
      });
      console.error('Using mock data as fallback');
      return NextResponse.json(getMockWeatherData(date));
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    console.log('Real weather data received from API');

    // Get the requested date
    const requestDate = new Date(date);
    const requestDateStr = requestDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const isToday = requestDateStr === todayStr;

    console.log(`Requested date: ${requestDateStr}, Today: ${todayStr}, Is today: ${isToday}`);

    // Filter forecast data for the requested date (use more flexible date matching)
    const forecastsForDate = forecastData.list.filter((item: any) => {
      const itemDateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
      return itemDateStr === requestDateStr;
    });

    console.log(`Found ${forecastsForDate.length} forecasts for ${requestDateStr}`);

    // If no forecast for this date and it's not today, use mock data
    if (forecastsForDate.length === 0 && !isToday) {
      console.log(`No forecast available for ${date}, using mock data`);
      return NextResponse.json(getMockWeatherData(date));
    }

    // Group forecasts by time period
    const morning = forecastsForDate.find((item: any) => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 6 && hour < 12;
    });

    const afternoon = forecastsForDate.find((item: any) => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 12 && hour < 18;
    });

    const evening = forecastsForDate.find((item: any) => {
      const hour = new Date(item.dt * 1000).getHours();
      return hour >= 18 && hour < 24;
    });

    // Calculate daily min/max from all forecasts for the day
    // If it's today and we have current data, include it
    const temps = forecastsForDate.map((item: any) => item.main.temp);
    if (isToday && currentData.main) {
      temps.push(currentData.main.temp);
    }

    const minTemp = temps.length > 0 ? Math.min(...temps) : currentData.main.temp_min;
    const maxTemp = temps.length > 0 ? Math.max(...temps) : currentData.main.temp_max;

    // Use the most common weather condition for the day
    const mainWeather = forecastsForDate[0]?.weather[0] || currentData.weather[0];

    // Average precipitation probability
    const avgPrecipitation = forecastsForDate.length > 0
      ? forecastsForDate.reduce((sum: number, item: any) =>
          sum + (item.pop || 0), 0) / forecastsForDate.length * 100
      : 0; // Default to 0 if no forecast data

    const weatherData = {
      date,
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        name: currentData.name || 'Location',
      },
      daily: {
        temp: {
          min: Math.round(minTemp),
          max: Math.round(maxTemp),
        },
        description: mainWeather.description,
        icon: mainWeather.icon,
        main: mainWeather.main,
        precipitation: Math.round(avgPrecipitation),
        humidity: forecastsForDate[0]?.main.humidity || currentData.main.humidity,
        windSpeed: forecastsForDate[0]?.wind.speed || currentData.wind.speed,
        clouds: forecastsForDate[0]?.clouds.all || currentData.clouds.all,
      },
      periods: {
        morning: morning ? {
          temp: Math.round(morning.main.temp),
          description: morning.weather[0].description,
          icon: morning.weather[0].icon,
          main: morning.weather[0].main,
          precipitation: Math.round((morning.pop || 0) * 100),
          time: '6h-12h',
        } : null,
        afternoon: afternoon ? {
          temp: Math.round(afternoon.main.temp),
          description: afternoon.weather[0].description,
          icon: afternoon.weather[0].icon,
          main: afternoon.weather[0].main,
          precipitation: Math.round((afternoon.pop || 0) * 100),
          time: '12h-18h',
        } : null,
        evening: evening ? {
          temp: Math.round(evening.main.temp),
          description: evening.weather[0].description,
          icon: evening.weather[0].icon,
          main: evening.weather[0].main,
          precipitation: Math.round((evening.pop || 0) * 100),
          time: '18h-23h',
        } : null,
      },
      suitable: getSuitabilityInfo(
        { weather: [mainWeather], temp: { day: (minTemp + maxTemp) / 2 } },
        morning,
        afternoon,
        evening
      ),
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

    // Handle both old format (dailyForecast) and new format (forecast API)
    const main = data.weather?.[0]?.main || data.main?.weather?.[0]?.main || daily?.weather?.[0]?.main;
    const precipitation = data.pop ? data.pop * 100 : (data.precipitation || 0);
    const temp = data.main?.temp || data.temp || daily?.temp?.day;

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
// Generates variable weather based on date to simulate real conditions
function getMockWeatherData(date: string) {
  // Use date as seed for pseudo-random but consistent data
  const dateObj = new Date(date);
  const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = dayOfYear % 10; // 0-9 based on day of year

  // Weather patterns based on seed
  const patterns = [
    { main: 'Clear', desc: 'ciel dégagé', icon: '01d', precip: 5, temp: 22 },
    { main: 'Clouds', desc: 'partiellement nuageux', icon: '02d', precip: 15, temp: 18 },
    { main: 'Clouds', desc: 'nuageux', icon: '03d', precip: 25, temp: 16 },
    { main: 'Clouds', desc: 'très nuageux', icon: '04d', precip: 35, temp: 14 },
    { main: 'Rain', desc: 'pluie légère', icon: '10d', precip: 65, temp: 12 },
    { main: 'Rain', desc: 'pluie', icon: '09d', precip: 80, temp: 10 },
    { main: 'Clear', desc: 'ensoleillé', icon: '01d', precip: 0, temp: 24 },
    { main: 'Clouds', desc: 'quelques nuages', icon: '02d', precip: 10, temp: 20 },
    { main: 'Drizzle', desc: 'bruine', icon: '09d', precip: 50, temp: 13 },
    { main: 'Clear', desc: 'dégagé', icon: '01d', precip: 5, temp: 21 },
  ];

  const pattern = patterns[seed];
  const tempVariation = (seed % 3) - 1; // -1, 0, or +1

  const morningTemp = Math.round(pattern.temp - 4 + tempVariation);
  const afternoonTemp = Math.round(pattern.temp + tempVariation);
  const eveningTemp = Math.round(pattern.temp - 2 + tempVariation);

  const morningPrecip = Math.max(0, pattern.precip - 10);
  const afternoonPrecip = pattern.precip;
  const eveningPrecip = Math.max(0, pattern.precip - 5);

  // Suitable conditions logic
  const getSuitability = (temp: number, precip: number, main: string) => {
    if (main === 'Rain' && precip > 60) {
      return { suitable: false, reason: 'Pluie prévue - privilégier intérieur' };
    } else if (main === 'Drizzle' && precip > 40) {
      return { suitable: false, reason: 'Bruine - privilégier intérieur' };
    } else if (main === 'Clear') {
      return { suitable: true, reason: 'Idéal pour activités extérieures' };
    } else {
      return { suitable: true, reason: 'Conditions acceptables pour extérieur' };
    }
  };

  return {
    date,
    location: {
      lat: 45.5017,
      lon: -73.5673,
      name: 'Montreal',
    },
    daily: {
      temp: { min: morningTemp, max: afternoonTemp },
      description: pattern.desc,
      icon: pattern.icon,
      main: pattern.main,
      precipitation: afternoonPrecip,
      humidity: 60 + seed * 2,
      windSpeed: 10 + seed,
      clouds: pattern.precip * 1.5,
    },
    periods: {
      morning: {
        temp: morningTemp,
        description: pattern.desc,
        icon: pattern.icon,
        main: pattern.main,
        precipitation: morningPrecip,
        time: '6h-12h',
      },
      afternoon: {
        temp: afternoonTemp,
        description: pattern.desc,
        icon: pattern.icon,
        main: pattern.main,
        precipitation: afternoonPrecip,
        time: '12h-18h',
      },
      evening: {
        temp: eveningTemp,
        description: pattern.desc,
        icon: pattern.icon.replace('d', 'n'), // Night icon
        main: pattern.main,
        precipitation: eveningPrecip,
        time: '18h-23h',
      },
    },
    suitable: {
      morning: { ...getSuitability(morningTemp, morningPrecip, pattern.main), main: pattern.main, precipitation: morningPrecip, temp: morningTemp },
      afternoon: { ...getSuitability(afternoonTemp, afternoonPrecip, pattern.main), main: pattern.main, precipitation: afternoonPrecip, temp: afternoonTemp },
      evening: { ...getSuitability(eveningTemp, eveningPrecip, pattern.main), main: pattern.main, precipitation: eveningPrecip, temp: eveningTemp },
    },
  };
}
