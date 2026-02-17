/**
 * Géolocalisation avec l'API Adresse du Gouvernement Français
 * Gratuit, illimité, officiel
 * https://adresse.data.gouv.fr/api-doc/adresse
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
    coordinates: [number, number];
  };
  properties: {
    city?: string;
    name?: string;
    postcode?: string;
  };
}

/**
 * Obtenir les coordonnées GPS d'un code postal
 */
export async function getCoordinatesFromPostalCode(
  postalCode: string,
  countryCode: string = 'FR'
): Promise<GeoLocation | null> {
  try {
    // API Adresse française (gratuite et officielle)
    if (countryCode === 'FR') {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality&limit=1`
      );

      if (!response.ok) {
        throw new Error('Erreur API Adresse');
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          city: feature.properties.city || feature.properties.name,
          postalCode: feature.properties.postcode || postalCode,
          country: countryCode,
        };
      }
    }

    // Pour les autres pays, utiliser Nominatim (OpenStreetMap)
    return await getCoordinatesFromNominatim(postalCode, countryCode);
  } catch (error) {
    console.error('Erreur géocodage:', error);
    return null;
  }
}

/**
 * Alternative avec Nominatim (OpenStreetMap) pour tous les pays
 * Gratuit mais limité à 1 requête/seconde
 */
async function getCoordinatesFromNominatim(
  postalCode: string,
  countryCode: string
): Promise<GeoLocation | null> {
  try {
    const countryName = getCountryName(countryCode);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=${countryName}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PlanningApp/1.0', // Requis par Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur Nominatim');
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        city: result.display_name.split(',')[0],
        postalCode: postalCode,
        country: countryCode,
      };
    }

    return null;
  } catch (error) {
    console.error('Erreur Nominatim:', error);
    return null;
  }
}

/**
 * Calculer la distance entre deux points GPS (formule de Haversine)
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
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arrondir à 1 décimale
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convertir code pays en nom de pays
 */
function getCountryName(countryCode: string): string {
  const countries: Record<string, string> = {
    FR: 'France',
    BE: 'Belgium',
    CH: 'Switzerland',
    LU: 'Luxembourg',
  };
  return countries[countryCode] || countryCode;
}

/**
 * Trouver les villes proches d'un code postal
 */
export async function findNearbyCities(
  postalCode: string,
  countryCode: string,
  radius: number = 50 // rayon en km
): Promise<GeoLocation[]> {
  try {
    const origin = await getCoordinatesFromPostalCode(postalCode, countryCode);
    if (!origin) return [];

    // Pour la France, utiliser l'API Adresse
    if (countryCode === 'FR') {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?lat=${origin.latitude}&lon=${origin.longitude}&limit=20`
      );

      if (!response.ok) return [];

      const data = await response.json();

      return data.features
        .map((feature: AddressFeature) => ({
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          city: feature.properties.city || feature.properties.name,
          postalCode: feature.properties.postcode,
          country: countryCode,
        }))
        .filter((location: GeoLocation) => {
          const distance = calculateDistance(
            origin.latitude,
            origin.longitude,
            location.latitude,
            location.longitude
          );
          return distance <= radius;
        });
    }

    return [];
  } catch (error) {
    console.error('Erreur recherche villes proches:', error);
    return [];
  }
}

/**
 * Estimer la durée de trajet en voiture
 * Approximation basée sur la distance
 */
export function estimateDuration(distanceKm: number): string {
  // Vitesse moyenne : 50 km/h en ville, 90 km/h hors ville
  const avgSpeed = distanceKm < 20 ? 50 : 90;
  const hours = distanceKm / avgSpeed;
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return `${minutes}min`;
  } else {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  }
}