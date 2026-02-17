/**
 * iRacing content included with base membership
 * These items should be pre-selected and cannot be unchecked
 * Source: https://www.iracing.com/cars/ and https://www.iracing.com/tracks/
 */

export const FREE_CARS = [
  // Oval
  "Street Stock",
  "Legends Ford '34 Coupe",
  "Late Model Stock",
  // Dirt Oval
  "Dirt Street Stock",
  "Dirt Legends Ford '34 Coupe",
  "UMP Modified",
  "Dirt Micro Sprint Car",
  // Road
  "Pontiac Solstice",
  "MX-5 Cup",
  "Mazda MX-5 Cup",
  "Global Mazda MX-5 Cup",
  "Skip Barber Formula 2000",
  "Ray FF1600",
  "SCCA Spec Racer Ford",
  // Formula
  "Formula Vee",
  "Dallara F3",
  "Indy Pro 2000",
  // Rallycross
  "Volkswagen Beetle",
  "Volkswagen Beetle Lite",
  "FIA Cross Car",
];

export const FREE_TRACKS = [
  // Ovals
  "Charlotte Motor Speedway - Legends Oval",
  "Oxford Plains Speedway",
  "South Boston Speedway",
  "Thompson Speedway Motorsports Park",
  "USA International Speedway",
  // Road Courses
  "WeatherTech Raceway at Laguna Seca",
  "Laguna Seca",
  "Lime Rock Park",
  "Okayama International Circuit",
  "Oulton Park Circuit",
  "Tsukuba Circuit",
  // Dirt
  "Oran Park Raceway",
];

/**
 * Check if a car is included with base membership (case-insensitive partial match)
 */
export function isFreeCar(carName: string): boolean {
  const normalizedCar = carName.toLowerCase();
  return FREE_CARS.some((freeCar) =>
    normalizedCar.includes(freeCar.toLowerCase()) ||
    freeCar.toLowerCase().includes(normalizedCar)
  );
}

/**
 * Check if a track is included with base membership (case-insensitive partial match)
 */
export function isFreeTrack(trackName: string): boolean {
  const normalizedTrack = trackName.toLowerCase();
  return FREE_TRACKS.some((freeTrack) =>
    normalizedTrack.includes(freeTrack.toLowerCase()) ||
    freeTrack.toLowerCase().includes(normalizedTrack)
  );
}

/**
 * Get all included cars from a list of cars
 */
export function getFreeCarsFromList(cars: string[]): string[] {
  return cars.filter(isFreeCar);
}

/**
 * Get all included tracks from a list of tracks
 */
export function getFreeTracksFromList(tracks: string[]): string[] {
  return tracks.filter(isFreeTrack);
}
