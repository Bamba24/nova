/**
 * Service de géocodage avec l'API Adresse du Gouvernement Français
 * https://api-adresse.data.gouv.fr
 */

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city: string;
  postalCode: string;
  country: string;
}

interface AddressFeature {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    city?: string;
    name?: string;
    postcode?: string;
  };
}

/**
 * 🔎 Obtenir plusieurs villes à partir d’un code postal
 */
export async function getCitiesFromPostalCode(
  postalCode: string,
  limit: number = 10
): Promise<GeoLocation[]> {
  try {
    const response = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Erreur API Adresse");
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map((feature: AddressFeature) => ({
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      city: feature.properties.city || feature.properties.name || "",
      postalCode: feature.properties.postcode || postalCode,
      country: "FR",
    }));

  } catch (error) {
    console.error("Erreur récupération villes:", error);
    return [];
  }
}

/**
 * 📍 Obtenir UNE seule ville (meilleure correspondance)
 */
export async function getCoordinatesFromPostalCode(
  postalCode: string
): Promise<GeoLocation | null> {
  const cities = await getCitiesFromPostalCode(postalCode, 1);
  return cities.length > 0 ? cities[0] : null;
}

/**
 * 📏 Calculer la distance entre deux points GPS (Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Arrondi à 1 décimale
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 🚗 Estimer durée trajet voiture (approximation)
 */
export function estimateDuration(distanceKm: number): string {
  const avgSpeed = distanceKm < 20 ? 50 : 90;
  const minutes = Math.round((distanceKm / avgSpeed) * 60);

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m > 0 ? `${h}h${m}` : `${h}h`;
}
