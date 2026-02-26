import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/admin/users/[id]/role - Changer le rôle d'un utilisateur
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user: admin } = authResult;
  const { id } = await params;

  try {
    const body = await request.json();
    const { role } = body;

    if (!role || !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Ne pas permettre de changer son propre rôle
    if (id === admin.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Logger l'action
    await prisma.adminLog.create({
      data: {
        adminUserId: admin.userId,
        action: 'ROLE_CHANGE',
        targetType: 'User',
        targetId: id,
        details: JSON.stringify({
          message: `Rôle de ${user.email} changé en ${role}`,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de rôle' },
      { status: 500 }
    );
  }
}