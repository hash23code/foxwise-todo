"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets } from "lucide-react";
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

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/weather?date=${date}`);
        if (response.ok) {
          const data = await response.json();
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
  }, [date]);

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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-center gap-2">
          <Cloud className="w-5 h-5 text-gray-400 animate-pulse" />
          <span className="text-gray-400 text-sm">{t.loading}</span>
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
    <div className="bg-gradient-to-br from-blue-900/30 via-gray-900/50 to-gray-800/30 rounded-xl p-4 sm:p-6 border border-blue-800/30 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.daily.main, 32)}
          <div>
            <h3 className="text-white font-semibold text-lg">
              {weather.daily.temp.min}° / {weather.daily.temp.max}°
            </h3>
            <p className="text-gray-400 text-sm capitalize">{weather.daily.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Droplets className="w-3 h-3" />
            <span>{Math.round(weather.daily.precipitation)}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Wind className="w-3 h-3" />
            <span>{Math.round(weather.daily.windSpeed)} km/h</span>
          </div>
        </div>
      </div>

      {/* Periods */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {periods.map(({ key, label, data }) => {
          if (!data) return null;

          const suitability = weather.suitable[key as keyof typeof weather.suitable];
          const isSuitable = suitability?.suitable;

          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-lg p-3 transition-all ${
                isSuitable
                  ? 'bg-green-900/20 border border-green-700/30'
                  : 'bg-orange-900/20 border border-orange-700/30'
              }`}
            >
              {/* Suitable indicator */}
              <div className={`absolute top-0 right-0 w-2 h-2 rounded-bl-lg ${
                isSuitable ? 'bg-green-500' : 'bg-orange-500'
              }`} />

              <div className="text-center">
                <p className="text-gray-400 text-xs mb-2">{label}</p>
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(data.main, 20)}
                </div>
                <p className="text-white font-semibold text-lg mb-1">{data.temp}°</p>
                <p className="text-gray-400 text-xs capitalize mb-2 line-clamp-1">{data.description}</p>

                {/* Precipitation */}
                <div className="flex items-center justify-center gap-1">
                  <Droplets className={`w-3 h-3 ${data.precipitation > 60 ? 'text-blue-400' : 'text-gray-500'}`} />
                  <span className={`text-xs ${data.precipitation > 60 ? 'text-blue-400' : 'text-gray-500'}`}>
                    {Math.round(data.precipitation)}%
                  </span>
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-gray-700">
                  {suitability?.reason}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary indicator */}
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <div className="flex items-start gap-2">
          <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
            weather.suitable.morning.suitable || weather.suitable.afternoon.suitable
              ? 'bg-green-500'
              : 'bg-orange-500'
          }`} />
          <p className="text-xs text-gray-400 leading-relaxed">
            {weather.suitable.morning.suitable || weather.suitable.afternoon.suitable
              ? language === 'fr'
                ? 'Bonnes conditions pour activités extérieures durant au moins une partie de la journée'
                : 'Good conditions for outdoor activities during at least part of the day'
              : language === 'fr'
                ? 'Privilégier les activités intérieures aujourd\'hui. Tâches urgentes peuvent être planifiées.'
                : 'Favor indoor activities today. Urgent tasks can still be scheduled.'}
          </p>
        </div>
      </div>
    </div>
  );
}
