/**
 * Weather Theme Utility
 * Handles solar progress calculation and theme selection (Base + Overlay)
 */

/**
 * Calculates solar progress (0 to 1) between sunrise and sunset.
 * Returns null if it's currently night.
 */
export const getSolarProgress = (
  now: Date,
  sunrise: string,
  sunset: string,
): number | null => {
  const [sunH, sunM] = sunrise.split(":").map(Number);
  const [setH, setM] = sunset.split(":").map(Number);

  const sunriseDate = new Date(now);
  sunriseDate.setHours(sunH, sunM, 0, 0);

  const sunsetDate = new Date(now);
  sunsetDate.setHours(setH, setM, 0, 0);

  const nowTime = now.getTime();
  const riseTime = sunriseDate.getTime();
  const setTime = sunsetDate.getTime();

  if (nowTime < riseTime || nowTime > setTime) return null; // Night

  return (nowTime - riseTime) / (setTime - riseTime);
};

export interface BackgroundTheme {
  gradient: string; // Tailwind gradient class or inline style
  overlayColor: string; // Tailwind color class for overlay
  overlayOpacity: number; // Opacity 0 to 1
  textColor: "light" | "dark";
  filter: string; // CSS Filter (e.g., blur, sepia for dust)
  hazeOpacity: number; // Extra overlay for dust/fog
}

/**
 * Determines the background theme based on solar progress, weather, and dust.
 * @param progress 0 (sunrise) to 1 (sunset), or null for night.
 * @param weatherType 'clear' | 'clouds' | 'rain' | 'snow' | 'fog'
 * @param dustGrade 1 (good) to 4 (very bad)
 */
export const getBackgroundTheme = (
  progress: number | null,
  weatherType: string,
  dustGrade: number = 1,
): BackgroundTheme => {
  const theme: BackgroundTheme = {
    gradient: "bg-gradient-to-b from-slate-900 via-slate-800 to-black",
    overlayColor: "bg-transparent",
    overlayOpacity: 0,
    textColor: "light",
    filter: "",
    hazeOpacity: 0,
  };

  // 1. Base Gradient (Time/Sun)
  if (progress === null) {
    theme.gradient = "bg-gradient-to-b from-slate-950 via-indigo-950 to-black";
    theme.textColor = "light";
  } else if (progress < 0.1) {
    theme.gradient =
      "bg-gradient-to-b from-blue-400 via-pink-300 to-orange-200";
    theme.textColor = "dark";
  } else if (progress < 0.4) {
    theme.gradient = "bg-gradient-to-b from-sky-400 via-blue-200 to-white";
    theme.textColor = "dark";
  } else if (progress < 0.6) {
    theme.gradient = "bg-gradient-to-b from-blue-500 via-sky-300 to-blue-50";
    theme.textColor = "dark";
  } else if (progress < 0.9) {
    theme.gradient =
      "bg-gradient-to-b from-blue-400 via-indigo-200 to-orange-100";
    theme.textColor = "dark";
  } else {
    theme.gradient =
      "bg-gradient-to-b from-orange-400 via-pink-400 to-indigo-900";
    theme.textColor = "light";
  }

  // 2. Weather Overlay
  const lowerWeather = weatherType.toLowerCase();

  if (lowerWeather.includes("cloud") || lowerWeather.includes("overcast")) {
    theme.overlayColor = "bg-slate-500";
    theme.overlayOpacity = 0.3;
    if (progress !== null && progress > 0.1 && progress < 0.9)
      theme.textColor = "dark";
  } else if (
    lowerWeather.includes("rain") ||
    lowerWeather.includes("drizzle")
  ) {
    theme.overlayColor = "bg-blue-900";
    theme.overlayOpacity = 0.4;
    theme.textColor = "light";
  } else if (lowerWeather.includes("snow")) {
    theme.overlayColor = "bg-white";
    theme.overlayOpacity = 0.4;
    theme.textColor = "dark";
  } else if (lowerWeather.includes("fog") || lowerWeather.includes("mist")) {
    // 안개: 뽀얗고 흐릿한 화이트 오버레이 강화
    theme.overlayColor = "bg-white";
    theme.overlayOpacity = 0.3;
    theme.filter = "blur(8px)";
    theme.hazeOpacity = 0.5;
    theme.textColor = "dark";
  }

  // 3. Dust Filter (AQI) - 시인성 대폭 강화
  if (dustGrade >= 3) {
    // 나쁨(3) 또는 매우나쁨(4)
    const intensity = dustGrade === 4 ? 1 : 0.6;
    theme.filter = `${theme.filter} sepia(${intensity * 0.6}) contrast(0.9) blur(${intensity * 2}px)`;
    theme.hazeOpacity = Math.max(theme.hazeOpacity, intensity * 0.45);

    // 매우 나쁨일 경우 배경에 누런 톤을 더 강하게 주입
    if (dustGrade >= 4) {
      theme.overlayColor = "bg-yellow-900";
      theme.overlayOpacity = Math.max(theme.overlayOpacity, 0.25);
    }
  }

  return theme;
};
