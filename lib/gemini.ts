import { getCoordinatesFromPostalCode, calculateDistance, estimateDuration } from '@/lib/geocoding';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface GeminiSuggestion {
  day: string;
  hour: string;
  city: string;
  postalCode: string;
  distance: number;
  duration: string;
  compatibility: number;
  reasoning: string;
  latitude?: number;
  longitude?: number;
}

interface ExistingSlot {
  day: string;
  hour: string;
  city: string;
  postalCode: string;
}

interface GeminiApiSuggestion {
  day: string;
  hour: string;
  city: string;
  postalCode: string;
  compatibility: number;
  reasoning: string;
}

export async function suggestSlotsWithAI(
  existingSlots: ExistingSlot[],
  postalCode: string,
  countryCode: string
): Promise<{
  suggestions: GeminiSuggestion[];
  reasoning: string;
}> {
  try {
    const originCoords = await getCoordinatesFromPostalCode(postalCode, countryCode);

    console.log('📍 Coordonnées origine:', originCoords);

    const prompt = `Tu es un assistant intelligent pour optimiser des plannings de tournées en ${countryCode}.

Contexte :
- Code postal de référence : ${postalCode}
${originCoords ? `- Ville de référence : ${originCoords.city}` : ''}
- Pays : ${countryCode}
- Créneaux déjà occupés : ${existingSlots.length > 0 ? JSON.stringify(existingSlots) : 'Aucun'}

Tâche :
Suggère 6 créneaux optimaux (jour + heure) pour organiser une tournée depuis le code postal ${postalCode}.

Critères d'optimisation :
1. Minimiser les distances entre les points
2. Éviter les créneaux déjà occupés
3. Regrouper les créneaux proches géographiquement
4. Prioriser les horaires de milieu de matinée (10h-11h) et d'après-midi (14h-16h)

Pour chaque suggestion, fournis :
- day : jour de la semaine (Lundi, Mardi, Mercredi, Jeudi ou Vendredi)
- hour : horaire (format "10h", "14h", etc.)
- city : ville suggérée proche du code postal ${postalCode}
- postalCode : code postal de la ville suggérée (doit être réel et proche de ${postalCode})
- compatibility : score de compatibilité de 0 à 100
- reasoning : explication COURTE (max 50 caractères)

Réponds UNIQUEMENT avec un objet JSON valide, de ce format exact :
{
  "suggestions": [
    {
      "day": "Lundi",
      "hour": "10h",
      "city": "Paris",
      "postalCode": "75001",
      "compatibility": 95,
      "reasoning": "Proximité optimale"
    }
  ],
  "reasoning": "Stratégie globale"
}`;

    console.log(`🤖 Calling Gemini API (${GEMINI_MODEL})...`);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:', errorText);
      throw new Error(`Erreur Gemini API: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('✅ Gemini response received');
    console.log('📄 Response length:', text.length, 'characters');

    // Nettoyage amélioré
    let cleanedText = text.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }
    
    // Extraire le JSON
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }

    // Parser avec réparation automatique
    let result;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseError: unknown) {
      console.error('❌ JSON parse error:', (parseError as Error).message);
      
      // Tentative de réparation
      try {
        const openBraces = (cleanedText.match(/\{/g) || []).length;
        const closeBraces = (cleanedText.match(/\}/g) || []).length;
        
        if (openBraces > closeBraces) {
          const missing = openBraces - closeBraces;
          cleanedText += '\n' + '}'.repeat(missing);
          console.log('🔧 JSON réparé automatiquement');
          result = JSON.parse(cleanedText);
        } else {
          throw parseError;
        }
      } catch (repairError) {
        console.error('❌ Full text:', cleanedText);
        throw new Error('Impossible de parser la réponse JSON de Gemini');
      }
    }

    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      throw new Error('Format de réponse invalide');
    }

    console.log(`🔍 Enrichissement de ${result.suggestions.length} suggestions...`);

    // Enrichir avec géolocalisation
    const enrichedSuggestions = await Promise.all(
      result.suggestions.map(async (s: GeminiApiSuggestion) => {
        const coords = await getCoordinatesFromPostalCode(s.postalCode, countryCode);
        
        let distance = 0;
        let duration = '0min';
        let latitude = originCoords?.latitude || 48.8566;
        let longitude = originCoords?.longitude || 2.3522;

        if (coords && originCoords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
          distance = calculateDistance(
            originCoords.latitude,
            originCoords.longitude,
            coords.latitude,
            coords.longitude
          );
          duration = estimateDuration(distance);
        }

        return {
          day: s.day,
          hour: s.hour,
          city: coords?.city || s.city,
          postalCode: s.postalCode,
          distance,
          duration,
          compatibility: s.compatibility,
          reasoning: s.reasoning,
          latitude,
          longitude,
        };
      })
    );

    console.log(`✅ ${enrichedSuggestions.length} suggestions enrichies (Gemini AI)`);

    return {
      suggestions: enrichedSuggestions,
      reasoning: result.reasoning || 'Suggestions optimisées par IA',
    };
  } catch (error) {
    console.error('❌ Erreur Gemini AI:', error);

    // Fallback
    const originCoords = await getCoordinatesFromPostalCode(postalCode, countryCode);
    
    const fallbackSuggestions: GeminiSuggestion[] = [
      {
        day: 'Lundi',
        hour: '10h',
        city: originCoords?.city || 'Ville proche',
        postalCode: postalCode,
        distance: 5,
        duration: '15min',
        compatibility: 80,
        reasoning: 'Créneau matinal',
        latitude: originCoords?.latitude || 48.8566,
        longitude: originCoords?.longitude || 2.3522,
      },
      {
        day: 'Mardi',
        hour: '14h',
        city: originCoords?.city || 'Ville proche',
        postalCode: postalCode,
        distance: 8,
        duration: '20min',
        compatibility: 75,
        reasoning: 'Après-midi optimal',
        latitude: originCoords?.latitude || 48.8566,
        longitude: originCoords?.longitude || 2.3522,
      },
      {
        day: 'Mercredi',
        hour: '10h',
        city: originCoords?.city || 'Ville proche',
        postalCode: postalCode,
        distance: 6,
        duration: '18min',
        compatibility: 78,
        reasoning: 'Bon équilibre',
        latitude: originCoords?.latitude || 48.8566,
        longitude: originCoords?.longitude || 2.3522,
      },
      {
        day: 'Jeudi',
        hour: '14h',
        city: originCoords?.city || 'Ville proche',
        postalCode: postalCode,
        distance: 7,
        duration: '19min',
        compatibility: 76,
        reasoning: 'Optimisation tournée',
        latitude: originCoords?.latitude || 48.8566,
        longitude: originCoords?.longitude || 2.3522,
      },
      {
        day: 'Vendredi',
        hour: '10h',
        city: originCoords?.city || 'Ville proche',
        postalCode: postalCode,
        distance: 4,
        duration: '12min',
        compatibility: 82,
        reasoning: 'Proximité max',
        latitude: originCoords?.latitude || 48.8566,
        longitude: originCoords?.longitude || 2.3522,
      },
      {
        day: 'Lundi',
        hour: '16h',
        city: originCoords?.city || 'Ville proche',
        postalCode: postalCode,
        distance: 9,
        duration: '22min',
        compatibility: 72,
        reasoning: 'Fin de journée',
        latitude: originCoords?.latitude || 48.8566,
        longitude: originCoords?.longitude || 2.3522,
      },
    ];

    return {
      suggestions: fallbackSuggestions,
      reasoning: 'Suggestions automatiques',
    };
  }
}