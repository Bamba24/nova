import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { createAdminLog, getIpFromRequest } from '@/lib/logger';

/**
 * DELETE /api/admin/users/[userId] - Supprimer un utilisateur
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

  // Vérifier que l'utilisateur est admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès non autorisé' },
      { status: 403 }
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Empêcher la suppression de soi-même
    if (id === user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: id },
    });

    // ✅ Logger la suppression
    await createAdminLog({
      userId: user.userId,
      action: 'USER_DELETE',
      targetType: 'USER',
      targetId: id,
      details: { 
        name: targetUser.name, 
        email: targetUser.email 
      },
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[userId] - Modifier le rôle d'un utilisateur
 */
// export async function PATCH(
//   request: NextRequest,
//   { params }: { params: Promise<{ userId: string }> }
// ) {
//   const authResult = await requireAuth(request);
//   if (authResult instanceof NextResponse) return authResult;

//   const { user } = authResult;
//   const { userId } = await params;
//   const ipAddress = getIpFromRequest(request);

//   if (user.role !== 'ADMIN') {
//     return NextResponse.json(
//       { error: 'Accès non autorisé' },
//       { status: 403 }
//     );
//   }

//   try {
//     const body = await request.json();
//     const { role } = body;

//     if (!role || !['USER', 'ADMIN'].includes(role)) {
//       return NextResponse.json(
//         { error: 'Rôle invalide' },
//         { status: 400 }
//       );
//     }

//     const targetUser = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!targetUser) {
//       return NextResponse.json(
//         { error: 'Utilisateur introuvable' },
//         { status: 404 }
//       );
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: { role },
//     });

//     // ✅ Logger le changement de rôle
//     await createAdminLog({
//       userId: user.userId,
//       action: 'ROLE_CHANGE',
//       targetType: 'USER',
//       targetId: userId,
//       details: { 
//         name: targetUser.name,
//         email: targetUser.email,
//         oldRole: targetUser.role,
//         newRole: role
//       },
//       ipAddress,
//     });

//     return NextResponse.json({
//       success: true,
//       user: {
//         id: updatedUser.id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         role: updatedUser.role,
//       },
//     });
//   } catch (error: any) {
//     console.error('Error updating user role:', error);
//     return NextResponse.json(
//       { error: 'Erreur lors de la mise à jour', details: error.message },
//       { status: 500 }
//     );
//   }
// }