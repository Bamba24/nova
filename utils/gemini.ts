/**
 * Configuration Gemini AI (Google)
 * API Key gratuite : https://aistudio.google.com/app/apikey
 */

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

type Slot = {
  city: string;
  date: string;
  hour: string;
  country: string;
  coordinates?: { lat: number; lng: number };
};

/**
 * Demander à Gemini de suggérer des créneaux optimaux
 */
export async function suggestSlotsWithAI(
  existingSlots: Slot[],
  availableHours: string[],
  postalCode: string,
  countryCode: string
): Promise<{
  suggestions: Array<{
    date: string;
    hour: string;
    reason: string;
  }>;
  reasoning: string;
}> {
  try {
    const prompt = `
Tu es un assistant de planification logistique.

Contexte :
- Planning actuel : ${existingSlots.length} créneaux existants
- Derniers créneaux : ${existingSlots.slice(-3).map(s => `${s.city} le ${s.date} à ${s.hour}`).join(', ')}
- Horaires disponibles : ${availableHours.join(', ')}
- Code postal de référence : ${postalCode} (${countryCode})

Objectif : Suggérer 3 créneaux optimaux pour les prochains jours.

Critères d'optimisation :
1. Minimiser les trajets inutiles
2. Regrouper les visites géographiquement proches
3. Équilibrer la charge horaire
4. Éviter les créneaux trop serrés

Réponds UNIQUEMENT au format JSON suivant (pas de markdown, juste le JSON) :
{
  "suggestions": [
    {
      "date": "YYYY-MM-DD",
      "hour": "10h",
      "reason": "Raison courte (max 50 caractères)"
    }
  ],
  "reasoning": "Explication globale de ta stratégie (max 200 caractères)"
}
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur Gemini API: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Parser la réponse JSON
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanText);

    return result;
  } catch (error) {
    console.error('Erreur Gemini AI:', error);
    
    // Fallback : suggestions basiques
    return {
      suggestions: [
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          hour: availableHours[0] || '10h',
          reason: 'Créneau disponible',
        },
        {
          date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          hour: availableHours[1] || '13h',
          reason: 'Créneau disponible',
        },
        {
          date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          hour: availableHours[2] || '16h',
          reason: 'Créneau disponible',
        },
      ],
      reasoning: 'Suggestions générées automatiquement (IA non disponible)',
    };
  }
}