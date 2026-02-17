/**
 * Calcule la distance entre deux points GPS en kilomètres
 * Formule de Haversine
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arrondi à 1 décimale
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Trie les villes par distance par rapport à un point de référence
 */
export function sortByDistance(
  referencePoint: { lat: number; lng: number },
  cities: Array<{ coordinates: { lat: number; lng: number } }>
) {
  return cities
    .map(city => ({
      ...city,
      distance: calculateDistance(
        referencePoint.lat,
        referencePoint.lng,
        city.coordinates.lat,
        city.coordinates.lng
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}