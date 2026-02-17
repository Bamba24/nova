/**
 * Récupérer les coordonnées GPS d'un code postal
 * Utilise l'API Nominatim d'OpenStreetMap (gratuite, pas de clé API)
 */
export async function getCoordinatesFromPostalCode(
  postalCode: string,
  countryCode: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=${countryCode}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PlanningApp/1.0', // Requis par Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur géocodage');
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error('Erreur géocodage:', error);
    return null;
  }
}

/**
 * Récupérer les informations d'une ville depuis un code postal
 */
export async function getCityInfoFromPostalCode(
  postalCode: string,
  countryCode: string
): Promise<{
  name: string;
  postal_code: string;
  country: string;
  coordinates: { lat: number; lng: number };
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${postalCode}&country=${countryCode}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PlanningApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erreur géocodage');
    }

    const data = await response.json();

    if (data.length === 0) {
      return null;
    }

    const place = data[0];

    return {
      name: place.display_name.split(',')[0], // Premier élément = ville
      postal_code: postalCode,
      country: countryCode,
      coordinates: {
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      },
    };
  } catch (error) {
    console.error('Erreur récupération ville:', error);
    return null;
  }
}