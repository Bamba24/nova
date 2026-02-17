// app/api/plannings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/plannings/[id] - Récupérer un planning spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { id } = await params;

  try {
    const planning = await prisma.planning.findFirst({
      where: {
        id,
        userId: user.userId, // S'assurer que l'utilisateur possède ce planning
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

    // Vérifier que le planning appartient à l'utilisateur
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

    // Mettre à jour
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
  { params }: { params: Promise< { id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { id } = await params;

  try {
    // Vérifier que le planning appartient à l'utilisateur
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

    // Supprimer (les slots seront supprimés en cascade)
    await prisma.planning.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Planning supprimé' });
  } catch (error) {
    console.error('Error deleting planning:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du planning' },
      { status: 500 }
    );
  }
}