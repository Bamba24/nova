import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getCoordinatesFromPostalCode, calculateDistance } from '@/lib/geocoding';
import type {City} from "@/types"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { postalCode, countryCode = 'FR' } = body;

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Code postal requis' },
        { status: 400 }
      );
    }

    // Obtenir les coordonnées du code postal de référence
    const originCoords = await getCoordinatesFromPostalCode(postalCode, countryCode);
    if (!originCoords) {
      return NextResponse.json(
        { error: 'Code postal invalide' },
        { status: 400 }
      );
    }

    console.log(`🔍 Recherche villes proches de ${postalCode} (${originCoords.city})`);

    // Prompt Gemini pour trouver des villes proches
    const prompt = `Tu es un expert en géographie française.

Donne-moi 8 villes réelles proches du code postal ${postalCode} (${originCoords.city}) en ${countryCode}.

Critères :
- Villes réelles existantes en France
- Codes postaux réels et valides
- Distance entre 0 et 50 km du code postal ${postalCode}
- Variété de distances (certaines proches, certaines plus loin)

Réponds UNIQUEMENT avec ce JSON valide (pas de markdown) :
{
  "cities": [
    {
      "name": "Nom de la ville",
      "postalCode": "75001",
      "distance": 5,
      "region": "Île-de-France"
    }
  ]
}`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error('Erreur API Gemini');
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Nettoyer et parser
    let cleanedText = text.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '');

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanedText = jsonMatch[0];

    const result = JSON.parse(cleanedText);

    // Enrichir avec vraies coordonnées et distances réelles
    const enrichedCities = await Promise.all(
      result.cities.map(async (city: City) => {
        const coords = await getCoordinatesFromPostalCode(city.postalCode, countryCode);
        
        let realDistance = city.distance;
        let latitude = originCoords.latitude;
        let longitude = originCoords.longitude;

        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
          realDistance = calculateDistance(
            originCoords.latitude,
            originCoords.longitude,
            coords.latitude,
            coords.longitude
          );
        }

        return {
          name: coords?.city || city.name,
          postalCode: city.postalCode,
          latitude,
          longitude,
          distance: realDistance,
          details: `${city.postalCode} - ${coords?.city || city.name || countryCode}`,
        };
      })
    );

    // Trier par distance
    enrichedCities.sort((a, b) => a.distance - b.distance);

    console.log(`✅ ${enrichedCities.length} villes trouvées`);

    return NextResponse.json({
      success: true,
      cities: enrichedCities,
      origin: originCoords,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error searching cities:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche', details: errorMessage },
      { status: 500 }
    );
  }
}