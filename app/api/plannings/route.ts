// app/api/plannings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/plannings - Récupérer tous les plannings de l'utilisateur
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const plannings = await prisma.planning.findMany({
      where: { userId: user.userId },
      include: {
        slots: {
          orderBy: { date: 'asc' },
        },
        _count: {
          select: { slots: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ plannings });
  } catch (error) {
    console.error('Error fetching plannings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des plannings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plannings - Créer un nouveau planning
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  try {
    const body = await request.json();
    const { name, hours, country = 'FR' } = body;

    // Validation
    if (!name || !hours || !Array.isArray(hours)) {
      return NextResponse.json(
        { error: 'Nom et horaires requis' },
        { status: 400 }
      );
    }

    if (hours.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un horaire doit être sélectionné' },
        { status: 400 }
      );
    }

    // Créer le planning
    const planning = await prisma.planning.create({
      data: {
        userId: user.userId,
        name,
        hours,
        country,
      },
      include: {
        _count: {
          select: { slots: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, planning },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating planning:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du planning' },
      { status: 500 }
    );
  }
}