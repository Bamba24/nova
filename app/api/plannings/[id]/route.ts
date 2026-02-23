import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { createAdminLog, getIpFromRequest } from '@/lib/logger';

/**
 * GET /api/plannings/[id] - Récupérer un planning spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { id } = await params;

  try {
    const planning = await prisma.planning.findFirst({
      where: {
        id,
        userId: user.userId,
      },
      include: {
        slots: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!planning) {
      return NextResponse.json(
        { error: 'Planning non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ planning });
  } catch (error) {
    console.error('Error fetching planning:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du planning' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/plannings/[id] - Modifier un planning
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, hours, country } = body;

    const existingPlanning = await prisma.planning.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    });

    if (!existingPlanning) {
      return NextResponse.json(
        { error: 'Planning non trouvé' },
        { status: 404 }
      );
    }

    const planning = await prisma.planning.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(hours && { hours }),
        ...(country && { country }),
      },
      include: {
        slots: true,
      },
    });

    return NextResponse.json({ success: true, planning });
  } catch (error) {
    console.error('Error updating planning:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du planning' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plannings/[id] - Supprimer un planning
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { id } = await params;
  const ipAddress = getIpFromRequest(request);

  try {
    const planning = await prisma.planning.findUnique({
      where: { id },
    });

    if (!planning || planning.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Planning introuvable ou non autorisé' },
        { status: 404 }
      );
    }

    await prisma.planning.delete({
      where: { id },
    });

    // ✅ Logger la suppression
    await createAdminLog({
      userId: user.userId,
      action: 'PLANNING_DELETE',
      targetType: 'PLANNING',
      targetId: id,
      details: { name: planning.name },
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting planning:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: errorMessage },
      { status: 500 }
    );
  }
}