"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface WeatherData {
  date: string;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  daily: {
    temp: { min: number; max: number };
    description: string;
    icon: string;
    main: string;
    precipitation: number;
    humidity: number;
    windSpeed: number;
    clouds: number;
  } | null;
  periods: {
    morning: PeriodData | null;
    afternoon: PeriodData | null;
    evening: PeriodData | null;
  };
  suitable: {
    morning: SuitabilityInfo;
    afternoon: SuitabilityInfo;
    evening: SuitabilityInfo;
  };
}

interface PeriodData {
  temp: number;
  description: string;
  icon: string;
  main: string;
  precipitation: number;
  time: string;
}

interface SuitabilityInfo {
  suitable: boolean;
  reason: string;
  main?: string;
  precipitation?: number;
  temp?: number;
}

interface WeatherWidgetProps {
  date: string;
  onWeatherLoad?: (weather: WeatherData) => void;
}

export default function WeatherWidget({ date, onWeatherLoad }: WeatherWidgetProps) {
  const { language } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [useGeolocation, setUseGeolocation] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    // Check if user previously enabled geolocation
    const savedGeoPreference = localStorage.getItem('weather_use_geolocation');
    if (savedGeoPreference === 'true') {
      setUseGeolocation(true);
      requestGeolocation();
    }
  }, []);

  const requestGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lon: longitude });
          localStorage.setItem('weather_coords', JSON.stringify({ lat: latitude, lon: longitude }));
          localStorage.setItem('weather_use_geolocation', 'true');
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Fallback to default location if denied
          setUseGeolocation(false);
          localStorage.setItem('weather_use_geolocation', 'false');
        }
      );
    }
  };

  const toggleGeolocation = () => {
    if (!useGeolocation) {
      requestGeolocation();
      setUseGeolocation(true);
    } else {
      setUseGeolocation(false);
      setCoords(null);
      localStorage.setItem('weather_use_geolocation', 'false');
      localStorage.removeItem('weather_coords');
    }
  };

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        let url = `/api/weather?date=${date}`;

        // Use geolocation coords if enabled
        if (useGeolocation && coords) {
          url += `&lat=${coords.lat}&lon=${coords.lon}`;
        }

        // Add timestamp to bypass cache
        url += `&t=${Date.now()}`;

        console.log('Fetching weather for date:', date);

        const response = await fetch(url, {
          cache: 'no-store', // Disable caching to ensure fresh data
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Weather data received:', data);
          setWeather(data);
          if (onWeatherLoad) {
            onWeatherLoad(data);
          }
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [date, coords, useGeolocation]);

  const getWeatherIcon = (main: string, size: number = 24) => {
    switch (main) {
      case 'Clear':
        return <Sun className={`w-${size} h-${size} text-yellow-400`} />;
      case 'Rain':
      case 'Drizzle':
        return <CloudRain className={`w-${size} h-${size} text-blue-400`} />;
      case 'Snow':
        return <CloudSnow className={`w-${size} h-${size} text-blue-200`} />;
      case 'Clouds':
        return <Cloud className={`w-${size} h-${size} text-gray-400`} />;
      default:
        return <Cloud className={`w-${size} h-${size} text-gray-400`} />;
    }
  };

  const getCurrentTemp = () => {
    if (!weather || !weather.daily) {
      return 0;
    }

    // Determine current temperature based on time of day
    const now = new Date();
    const selectedDateObj = new Date(date);
    const isToday = now.toDateString() === selectedDateObj.toDateString();

    if (isToday) {
      const hour = now.getHours();
      if (hour >= 6 && hour < 12 && weather.periods.morning) {
        return weather.periods.morning.temp;
      } else if (hour >= 12 && hour < 18 && weather.periods.afternoon) {
        return weather.periods.afternoon.temp;
      } else if (hour >= 18 && weather.periods.evening) {
        return weather.periods.evening.temp;
      }
    }

    // For other days or if period not available, use afternoon temp or average
    if (weather.periods.afternoon) {
      return weather.periods.afternoon.temp;
    }

    // Fallback to average of min/max
    return Math.round((weather.daily.temp.min + weather.daily.temp.max) / 2);
  };

  const t = language === 'fr' ? {
    morning: 'Matin',
    afternoon: 'Après-midi',
    evening: 'Soir',
    loading: 'Chargement météo...',
    temp: 'Température',
    precipitation: 'Précipitations',
    suitable: 'Conditions favorables',
    notSuitable: 'Conditions défavorables',
  } : {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    loading: 'Loading weather...',
    temp: 'Temperature',
    precipitation: 'Precipitation',
    suitable: 'Suitable conditions',
    notSuitable: 'Unfavorable conditions',
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-3 border border-gray-700">
        <div className="flex items-center justify-center gap-2">
          <Cloud className="w-4 h-4 text-gray-400 animate-pulse" />
          <span className="text-gray-400 text-xs">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (!weather || !weather.daily) {
    return null;
  }

  const periods = [
    { key: 'morning', label: t.morning, data: weather.periods.morning },
    { key: 'afternoon', label: t.afternoon, data: weather.periods.afternoon },
    { key: 'evening', label: t.evening, data: weather.periods.evening },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-900/20 via-gray-900/40 to-gray-800/20 rounded-lg p-3 border border-blue-800/20 backdrop-blur-sm">
      {/* Compact Header - Single line on desktop */}
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Left: Weather icon + temp + description */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {getWeatherIcon(weather.daily.main, 20)}
          <div className="flex flex-col min-w-0">
            {/* Current temperature - larger */}
            <span className="text-white font-bold text-2xl leading-none">
              {getCurrentTemp()}°
            </span>
            {/* Min/Max temperatures - smaller */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-gray-400 text-xs whitespace-nowrap">
                {weather.daily.temp.min}°/{weather.daily.temp.max}°
              </span>
              <span className="text-gray-400 text-xs capitalize truncate">
                {weather.daily.description}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Stats + Geolocation button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              <span>{Math.round(weather.daily.precipitation)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              <span>{Math.round(weather.daily.windSpeed)}</span>
            </div>
          </div>

          {/* Geolocation toggle */}
          <button
            onClick={toggleGeolocation}
            className={`p-1.5 rounded-md transition-colors ${
              useGeolocation
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                : 'bg-gray-700/30 text-gray-500 border border-gray-600/30 hover:bg-gray-700/50'
            }`}
            title={useGeolocation ? (language === 'fr' ? 'Géolocalisation activée' : 'Geolocation enabled') : (language === 'fr' ? 'Activer la géolocalisation' : 'Enable geolocation')}
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Compact Periods - Reduced padding and size */}
      <div className="grid grid-cols-3 gap-1.5">
        {periods.map(({ key, label, data }) => {
          if (!data) return null;

          const suitability = weather.suitable[key as keyof typeof weather.suitable];
          const isSuitable = suitability?.suitable;

          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-md p-2 transition-all ${
                isSuitable
                  ? 'bg-green-900/15 border border-green-700/25'
                  : 'bg-orange-900/15 border border-orange-700/25'
              }`}
            >
              {/* Suitable indicator - smaller */}
              <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-bl ${
                isSuitable ? 'bg-green-500' : 'bg-orange-500'
              }`} />

              <div className="text-center">
                <p className="text-gray-400 text-[10px] mb-1">{label}</p>
                <div className="flex justify-center mb-1">
                  {getWeatherIcon(data.main, 16)}
                </div>
                <p className="text-white font-semibold text-sm mb-0.5">{data.temp}°</p>

                {/* Precipitation - compact */}
                <div className="flex items-center justify-center gap-0.5">
                  <Droplets className={`w-2.5 h-2.5 ${data.precipitation > 60 ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className={`text-[10px] ${data.precipitation > 60 ? 'text-blue-400' : 'text-gray-500'}`}>
                    {Math.round(data.precipitation)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
