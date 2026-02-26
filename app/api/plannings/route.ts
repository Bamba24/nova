import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { createAdminLog, getIpFromRequest } from '@/lib/logger';

/**
 * GET /api/plannings - Liste tous les plannings de l'utilisateur
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      plannings,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching plannings:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération', details: errorMessage },
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
  const ipAddress = getIpFromRequest(request);

  try {
    const body = await request.json();
    const { name, hours, country } = body;

    const planning = await prisma.planning.create({
      data: {
        userId: user.userId,
        name,
        hours,
        country,
      },
    });

    // ✅ Logger la création du planning
    await createAdminLog({
      userId: user.userId,
      action: 'PLANNING_CREATE',
      targetType: 'PLANNING',
      targetId: planning.id,
      details: { name, country, hoursCount: hours.length },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      planning,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating planning:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création', details: errorMessage },
      { status: 500 }
    );
  }
}