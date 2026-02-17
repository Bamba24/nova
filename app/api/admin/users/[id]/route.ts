import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/admin/users/[id] - Supprimer un utilisateur
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user: admin } = authResult;
  const { id } = await params;

  try {
    // Ne pas permettre la suppression de soi-même
    if (id === admin.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    // Logger l'action
    await prisma.adminLog.create({
      data: {
        adminUserId: admin.userId,
        action: 'USER_DELETE',
        targetType: 'User',
        targetId: id,
        details: JSON.stringify({
          message: `Utilisateur ${user.email} supprimé`,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}