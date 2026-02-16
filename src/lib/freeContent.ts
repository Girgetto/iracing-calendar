/**
 * Free iRacing content included with base membership
 * These items should be pre-selected and cannot be unchecked
 */

export const FREE_CARS = [
  "Street Stock",
  "Legends Ford '34 Coupe",
  "Pontiac Solstice",
  "MX-5 Cup",
  "Mazda MX-5 Cup",
  "Formula Vee",
  "Cadillac CTS-V",
  "Late Model Stock",
  "Indy Pro 2000",
  "Dallara F3",
  "Global Mazda MX-5 Cup",
];

export const FREE_TRACKS = [
  "Charlotte Motor Speedway - Legends Oval",
  "WeatherTech Raceway at Laguna Seca",
  "Laguna Seca",
  "Lime Rock Park",
  "Okayama International Circuit",
  "Oran Park Raceway",
  "Oxford Plains Speedway",
  "South Boston Speedway",
  "Thompson Speedway",
  "USA International Speedway",
];

/**
 * Check if a car is free content (case-insensitive partial match)
 */
export function isFreeCar(carName: string): boolean {
  const normalizedCar = carName.toLowerCase();
  return FREE_CARS.some((freeCar) =>
    normalizedCar.includes(freeCar.toLowerCase()) ||
    freeCar.toLowerCase().includes(normalizedCar)
  );
}

/**
 * Check if a track is free content (case-insensitive partial match)
 */
export function isFreeTrack(trackName: string): boolean {
  const normalizedTrack = trackName.toLowerCase();
  return FREE_TRACKS.some((freeTrack) =>
    normalizedTrack.includes(freeTrack.toLowerCase()) ||
    freeTrack.toLowerCase().includes(normalizedTrack)
  );
}

/**
 * Get all free cars from a list of cars
 */
export function getFreeCarsFromList(cars: string[]): string[] {
  return cars.filter(isFreeCar);
}

/**
 * Get all free tracks from a list of tracks
 */
export function getFreeTracksFromList(tracks: string[]): string[] {
  return tracks.filter(isFreeTrack);
}
