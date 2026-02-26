import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { createAdminLog, getIpFromRequest } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  const { id: slotId } = await params;
  const ipAddress = getIpFromRequest(request);

  try {
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { planning: true }
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Créneau introuvable' },
        { status: 404 }
      );
    }

    if (slot.planning.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await prisma.slot.delete({
      where: { id: slotId }
    });

    // ✅ Logger la suppression du créneau
    await createAdminLog({
      userId: user.userId,
      action: 'SLOT_DELETE',
      targetType: 'SLOT',
      targetId: slotId,
      details: { 
        city: slot.city, 
        day: slot.day, 
        hour: slot.hour,
        planningName: slot.planning.name
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Créneau supprimé'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting slot:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: errorMessage },
      { status: 500 }
    );
  }
}