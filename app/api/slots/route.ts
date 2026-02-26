// app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { SlotStatus } from '@prisma/client';
import { createAdminLog, getIpFromRequest } from '@/lib/logger';

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
  const ipAddress = getIpFromRequest(request);

  try {
    const body = await request.json();
    const {
      planningId,
      city,
      postalCode,
      latitude,
      longitude,
      day,
      hour,
      date,
    } = body;

    const planning = await prisma.planning.findUnique({
      where: { id: planningId },
    });

    if (!planning || planning.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Planning introuvable' },
        { status: 404 }
      );
    }

    const slot = await prisma.slot.create({
      data: {
        planningId,
        city,
        postalCode,
        latitude,
        longitude,
        day,
        hour,
        date: new Date(date),
        status: 'PLANNED',
      },
    });

    // ✅ Logger l'ajout du créneau
    await createAdminLog({
      userId: user.userId,
      action: 'SLOT_CREATE',
      targetType: 'SLOT',
      targetId: slot.id,
      details: { 
        city, 
        postalCode, 
        day, 
        hour,
        planningName: planning.name 
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      slot,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création'},
      { status: 500 }
    );
  }
}