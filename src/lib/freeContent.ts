/**
 * iRacing content included with base membership
 * These items should be pre-selected and cannot be unchecked
 * Source: https://www.iracing.com/cars/ and https://www.iracing.com/tracks/
 */

export const FREE_CARS = [
  // Oval — all variants matched via partial name
  "Street Stock",       // Street Stock – Panther
  "Mini Stock",         // Mini Stock (oval) and Mini Stock – Dirt
  "Legends Ford '34 Coupe", // INEX Legends Ford '34 Coupe
  "NASCAR Truck Chevrolet Silverado", // 2008 variant
  // Sports Car / Road — all variants matched via partial name
  "BMW M2 CS Racing",
  "Toyota GR86",
  "Cadillac CTS-V",
  "Kia Optima",
  "Volkswagen Jetta TDi",
  "Pontiac Solstice",   // Club Sport and Club Sport – Rookie
  "Mazda MX-5",         // MX-5 Cup – 2010 and MX-5 Roadster – 2010
  "Global Mazda MX-5 Cup",
  // Prototype
  "Radical SR8",
  "SCCA Spec Racer Ford",
  // Formula
  "Ray FF1600",
  "Formula Vee",
  // Dirt Oval
  "Dirt Street Stock",
  "Dirt Legends Ford '34 Coupe",
  "UMP Modified",
  "Dirt Micro Sprint",
  // Rallycross
  "FIA Cross Car",
  "VW Beetle",          // VW Beetle and VW Beetle Lite
  // Off-Road
  "Lucas Oil Off-Road Pro 2 Lite",
];

export const FREE_TRACKS = [
  // Road Courses — base name matches all configurations/variants
  "Circuito de Navarra",
  "Circuit de Ledenon",
  "VIRginia International Raceway",
  "Motorsport Arena Oschersleben",
  "Rudskogen Motorsenter",
  "Winton Motor Raceway",
  "Lime Rock Park",
  "Wild West Motorsports Park",
  "Tsukuba Circuit",
  "Snetterton",
  "Okayama International Circuit",
  "Oulton Park",
  "Summit Point Motorsports Park",
  "Oran Park Raceway",
  "Centripetal Circuit",
  // Ovals — base name matches all configurations/variants
  "Charlotte Motor Speedway",
  "Southern National Motorsports Park",
  "Limaland Motorsports Park",
  "Lanier National Speedway",  // paved and dirt variants both included
  "South Boston Speedway",
  "Thompson Speedway Motorsports Park",
  "Concord Speedway",
  "Oxford Plains Speedway",
  "USA International Speedway", // paved and dirt variants both included
  "Langley Speedway",
  "Phoenix Raceway - 2008",     // only the 2008 configuration is included
  // Rallycross / Special
  "Daytona International Speedway - Rallycross", // only rallycross config included
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
