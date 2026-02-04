import { useEffect, useState, useMemo } from "react";
import type { WeatherItem } from "../api/weather";
import type { DustItem } from "../api/dust";
import {
  getSolarProgress,
  getBackgroundTheme,
} from "../utils/weatherThemeUtils";
import { calculateSolarTimes } from "../utils/solarCalculator";
import { dfs_grid_to_latlng } from "../utils/coordinateConverter";

interface Props {
  weatherData: WeatherItem[];
  dustData: DustItem | null;
  nx?: number;
  ny?: number;
  onThemeChange?: (textColor: "light" | "dark") => void;
}

export default function WeatherBackground({
  weatherData,
  dustData,
  nx = 60,
  ny = 127,
  onThemeChange,
}: Props) {
  const [now, setNow] = useState(new Date());

  // 1. Accessibility: Check for reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 2. Data extraction
  const getValue = (category: string) =>
    weatherData.find((item) => item.category === category)?.obsrValue || "0";

  const pty = getValue("PTY"); // Precipitation type
  const sky = getValue("SKY"); // Sky status
  const wsd = parseFloat(getValue("WSD")); // Wind Speed (m/s)
  const vec = parseInt(getValue("VEC")); // Wind Direction (deg)
  const rn1 = parseFloat(getValue("RN1").replace("mm", "")) || 0; // Precipitation Amount
  const pm10Grade = dustData ? parseInt(dustData.pm10Grade) : 1;

  // 3. Environmental Physics Calculation
  // Wind Direction (VEC): 0-360 deg. 0 is North, 180 is South.
  // We want to calculate a tilt (skew) for particles.
  // Wind blowing FROM 270 (West) means particles fly to the Right (+ angle).
  const windTilt = useMemo(() => {
    if (wsd < 0.5) return 0;
    // Map VEC to -30 to 30 degrees tilt
    // Simple mapping: West (270) -> 30, East (90) -> -30
    const rad = (vec * Math.PI) / 180;
    const horizontalWind = -Math.sin(rad) * wsd; // Negative sin because West is 270 (-1 sin), East is 90 (+1 sin)
    return Math.max(-30, Math.min(30, horizontalWind * 5));
  }, [wsd, vec]);

  const particleIntensity = useMemo(() => {
    // scale factor for particle counts based on rn1
    if (rn1 <= 0) return 1;
    if (rn1 < 1) return 1.5;
    if (rn1 < 5) return 2.5;
    return 4;
  }, [rn1]);

  const isThunderstorm = pty === "4" || (rn1 > 10 && sky === "4");

  // 3. Dynamic Solar Calculation
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const solarTimes = useMemo(() => {
    const { lat, lng } = dfs_grid_to_latlng(nx, ny);
    const stableDate = new Date(year, month, date);
    return calculateSolarTimes(lat, lng, stableDate);
  }, [nx, ny, year, month, date]);

  useEffect(() => {
    const timer = setInterval(() => {
      const params = new URLSearchParams(window.location.search);
      const debugHour = params.get("hour");
      if (debugHour) {
        const d = new Date();
        d.setHours(parseInt(debugHour), 0, 0, 0);
        setNow(d);
      } else {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 4. Mapping weather types
  const weatherType = useMemo(() => {
    if (pty === "1" || pty === "4" || pty === "5") return "rain";
    if (pty === "2" || pty === "3" || pty === "6" || pty === "7") return "snow";
    if (sky === "4") return "overcast";
    if (sky === "3") return "clouds";
    return "clear";
  }, [pty, sky]);

  // 5. Theme Calculation
  const theme = useMemo(() => {
    const progress = getSolarProgress(
      now,
      solarTimes.sunrise,
      solarTimes.sunset,
    );
    return getBackgroundTheme(progress, weatherType, pm10Grade);
  }, [now, weatherType, pm10Grade, solarTimes]);

  useEffect(() => {
    if (onThemeChange) {
      onThemeChange(theme.textColor);
    }
  }, [theme.textColor, onThemeChange]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* 1. Base Gradient (Sun/Time) */}
      <div
        className={`absolute inset-0 transition-all duration-[3000ms] ${theme.gradient}`}
      />

      {/* 2. Dust/Fog Haze Layer (Intensified) */}
      <div
        className="absolute inset-0 bg-yellow-900/10 pointer-events-none transition-all duration-[2000ms]"
        style={{
          opacity: theme.hazeOpacity,
          backdropFilter: theme.filter,
          WebkitBackdropFilter: theme.filter,
        }}
      />

      {/* 3. Weather Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-[2000ms] ${theme.overlayColor}`}
        style={{ opacity: theme.overlayOpacity }}
      />

      {/* 4. Thunderstorm Flash Layer */}
      {isThunderstorm && !reducedMotion && <ThunderFlash />}

      {/* --- Sky Objects --- */}
      {theme.textColor === "dark" && weatherType === "clear" && (
        <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-100 rounded-full blur-[40px] opacity-60 animate-pulse" />
      )}

      {/* Clouds Animation */}
      {(weatherType === "clouds" || weatherType === "overcast") &&
        !reducedMotion && (
          <>
            <div className="absolute top-[10%] left-[-20%] w-[140%] h-48 bg-white/20 blur-[50px] rounded-full animate-[cloud-move_60s_linear_infinite]" />
            <div className="absolute top-[20%] right-[-20%] w-[120%] h-40 bg-white/10 blur-[40px] rounded-full animate-[cloud-move-reverse_80s_linear_infinite]" />
          </>
        )}

      {/* --- Precipitation --- */}
      {weatherType === "rain" && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.floor(25 * particleIntensity) }).map(
            (_, i) => (
              <RainDrop
                key={i}
                reducedMotion={reducedMotion}
                windTilt={windTilt}
                windSpeed={wsd}
              />
            ),
          )}
        </div>
      )}

      {weatherType === "snow" && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.floor(15 * particleIntensity) }).map(
            (_, i) => (
              <SnowFlake
                key={i}
                reducedMotion={reducedMotion}
                windTilt={windTilt}
                windSpeed={wsd}
              />
            ),
          )}
        </div>
      )}

      {/* --- Mascot --- */}
      {/* <div
        className={`absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none opacity-90 z-10 ${reducedMotion ? "" : "animate-[float_6s_ease-in-out_infinite]"}`}
      >
        <img
          src="/gurumi_192x192.png"
          alt="Weather Mascot"
          className="w-full h-full object-contain drop-shadow-2xl"
        />
      </div> */}

      {/* --- Global Styles for Animations --- */}
      <style>{`
        @keyframes cloud-move {
          0% { transform: translateX(0); }
          50% { transform: translateX(50px); }
          100% { transform: translateX(0); }
        }
        @keyframes cloud-move-reverse {
          0% { transform: translateX(0); }
          50% { transform: translateX(-50px); }
          100% { transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }
        @keyframes snow {
          0% { transform: translateY(-10px) translateX(0); opacity: 1; }
          100% { transform: translateY(100vh) translateX(20px); opacity: 0.3; }
        }
        @keyframes rain-drop {
          0% { transform: translateY(-20px) scaleY(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { transform: translateY(110vh) scaleY(1.2); opacity: 0; }
        }
        @keyframes thunder-flash {
          0%, 100% { opacity: 0; }
          10%, 90% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function ThunderFlash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const trigger = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 100 + Math.random() * 200);

      // Schedule next flash
      const next = 5000 + Math.random() * 10000;
      return setTimeout(trigger, next);
    };

    const timer = setTimeout(trigger, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 bg-white z-20 pointer-events-none animate-[thunder-flash_0.2s_ease-out]" />
  );
}

function SnowFlake({
  reducedMotion,
  windTilt,
  windSpeed,
}: {
  reducedMotion: boolean;
  windTilt: number;
  windSpeed: number;
}) {
  const [style] = useState<React.CSSProperties>(() => ({
    width: `${Math.random() * 8 + 4}px`,
    height: `${Math.random() * 8 + 4}px`,
    top: `-${Math.random() * 20}px`,
    left: `${Math.random() * 130 - 15}%`, // Overflow for tilt
    animationDuration: `${Math.random() * 5 + 5 / (1 + windSpeed * 0.1)}s`,
    animationDelay: `-${Math.random() * 10}s`, // Negative delay to pre-warm
    transform: `rotate(${windTilt}deg) skewX(${windTilt}deg)`,
  }));

  const currentStyle = reducedMotion
    ? { ...style, animationDuration: "0s" }
    : style;

  return (
    <div
      className="absolute bg-white rounded-full opacity-70 animate-[snow_5s_linear_infinite]"
      style={currentStyle}
    />
  );
}

function RainDrop({
  reducedMotion,
  windTilt,
  windSpeed,
}: {
  reducedMotion: boolean;
  windTilt: number;
  windSpeed: number;
}) {
  const [style] = useState<React.CSSProperties>(() => ({
    width: `${Math.random() * 1.5 + 1}px`,
    height: `${Math.random() * 10 + 6}px`,
    top: `-${Math.random() * 50}px`,
    left: `${Math.random() * 130 - 15}%`, // Overflow for tilt
    animationDuration: `${(Math.random() * 0.5 + 1.2) / (1 + windSpeed * 0.2)}s`,
    animationDelay: `-${Math.random() * 2}s`, // Negative delay to pre-warm
    transform: `rotate(${windTilt}deg) skewX(${windTilt}deg)`,
  }));

  const currentStyle = reducedMotion
    ? { ...style, animationDuration: "0s" }
    : style;

  return (
    <div
      className="absolute bg-blue-100 rounded-full opacity-40 animate-[rain-drop_2s_linear_infinite]"
      style={currentStyle}
    />
  );
}
