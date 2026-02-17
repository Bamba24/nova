import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { suggestSlotsWithAI } from '@/lib/gemini';
import { getCoordinatesFromPostalCode } from '@/lib/geocoding';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const body = await request.json();
    const { postalCode, countryCode = 'FR', planningId } = body;

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Code postal requis' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching existing plannings...');

    // Vérifier que le code postal est valide
    const originCoords = await getCoordinatesFromPostalCode(postalCode, countryCode);
    if (!originCoords) {
      return NextResponse.json(
        { error: 'Code postal invalide ou non trouvé' },
        { status: 400 }
      );
    }

    console.log(`📍 Coordonnées trouvées: ${originCoords.city} (${originCoords.latitude}, ${originCoords.longitude})`);

    // Récupérer les plannings existants
    const existingPlannings = await prisma.planning.findMany({
      where: { 
        userId: user.userId,
        country: countryCode,
      },
      include: {
        slots: true,
      },
    });

    const existingSlots = existingPlannings.flatMap(p => 
      p.slots.map(s => ({
        day: s.day,
        hour: s.hour,
        city: s.city,
        postalCode: s.postalCode,
      }))
    );

    console.log(`📦 Contexte: ${existingSlots.length} créneaux existants`);

    // Appeler Gemini avec géolocalisation
    const aiResult = await suggestSlotsWithAI(
      existingSlots,
      postalCode,
      countryCode
    );

    console.log(`📊 ${aiResult.suggestions.length} suggestions générées`);

    // Enrichir avec IDs
    const enrichedSuggestions = aiResult.suggestions.map((s, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      title: `Suggestion ${index + 1}`,
      ...s,
      diffDistance: s.distance,
    }));

    // Sauvegarder dans la base de données
    await prisma.aISuggestion.create({
      data: {
        userId: user.userId,
        planningId,
        postalCode,
        countryCode,
        suggestionsJson: JSON.stringify(enrichedSuggestions),
        reasoning: aiResult.reasoning,
        accepted: false,
      },
    });

    console.log('💾 Suggestions saved to database');

    return NextResponse.json({
      success: true,
      suggestions: enrichedSuggestions,
      reasoning: aiResult.reasoning,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error generating suggestions:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération des suggestions',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}