/**
 * Solar Calculator
 * Calculates sunrise and sunset times based on latitude, longitude, and date.
 * Based on the Solar General Almanac formulas (Simplified).
 */

export interface SolarTimes {
  sunrise: string; // HH:mm
  sunset: string; // HH:mm
}

/**
 * Calculates sunrise and sunset times.
 * @param lat Latitude in degrees
 * @param lng Longitude in degrees
 * @param date Target date (defaults to now)
 * @returns { sunrise: string, sunset: string }
 */
export const calculateSolarTimes = (
  lat: number,
  lng: number,
  date: Date = new Date(),
): SolarTimes => {
  const radians = (deg: number) => (deg * Math.PI) / 180;
  const degrees = (rad: number) => (rad * 180) / Math.PI;

  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000,
  );

  // 1. Calculate the equation of time and solar declination
  const gamma =
    ((2 * Math.PI) / 365) * (dayOfYear - 1 + (date.getHours() - 12) / 24);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  // 2. Calculate the hour angle (ha)
  // -0.833 is standard refraction+solar disk correction
  const cosHa =
    Math.cos(radians(90.833)) / (Math.cos(radians(lat)) * Math.cos(decl)) -
    Math.tan(radians(lat)) * Math.tan(decl);

  // Boundary check (Polar regions)
  if (cosHa > 1) return { sunrise: "00:00", sunset: "00:00" }; // Polar night
  if (cosHa < -1) return { sunrise: "00:01", sunset: "23:59" }; // Midnight sun

  const ha = degrees(Math.acos(cosHa));

  // 3. Sunrise/Sunset in minutes from midnight (UTC)
  const sunriseUtc = 720 - 4 * (lng + ha) - eqTime;
  const sunsetUtc = 720 - 4 * (lng - ha) - eqTime;

  // 4. Convert to local time (assume system timezone)
  const timezoneOffset = -date.getTimezoneOffset(); // in minutes

  const toTimeString = (minutesFromMidnight: number) => {
    const localMinutes = (minutesFromMidnight + timezoneOffset + 1440) % 1440;
    const h = Math.floor(localMinutes / 60);
    const m = Math.floor(localMinutes % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return {
    sunrise: toTimeString(sunriseUtc),
    sunset: toTimeString(sunsetUtc),
  };
};
