// app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { SlotStatus } from '@prisma/client';

/**
 * GET /api/slots - Récupérer tous les slots (avec filtres optionnels)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { searchParams } = new URL(request.url);
  const planningId = searchParams.get('planningId');
  const status = searchParams.get('status');

  try {
    const slots = await prisma.slot.findMany({
      where: {
        planning: {
          userId: user.userId,
        },
        ...(planningId && { planningId }),
        ...(status && { status: status as SlotStatus }),
      },
      include: {
        planning: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des créneaux' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/slots - Créer un nouveau slot
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const body = await request.json();
    const {
      planningId,
      city,
      postalCode,
      latitude,
      longitude,
      day,
      date,
      hour,
      notes,
    } = body;

    // Validation
    if (!planningId || !city || !postalCode || !day || !date || !hour) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    // Vérifier que le planning appartient à l'utilisateur
    const planning = await prisma.planning.findFirst({
      where: {
        id: planningId,
        userId: user.userId,
      },
    });

    if (!planning) {
      return NextResponse.json(
        { error: 'Planning non trouvé' },
        { status: 404 }
      );
    }

    // Créer le slot
    const slot = await prisma.slot.create({
      data: {
        planningId,
        city,
        postalCode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        day,
        date: new Date(date),
        hour,
        notes,
        status: 'PLANNED',
      },
      include: {
        planning: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, slot },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating slot:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du créneau' },
      { status: 500 }
    );
  }
}