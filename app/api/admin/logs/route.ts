import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;

  // Vérifier que l'utilisateur est admin
  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès non autorisé' },
      { status: 403 }
    );
  }

  try {
    // ✅ Récupérer les logs avec la relation user via adminUserId
    const logs = await prisma.adminLog.findMany({
      include: {
        user: {  // ✅ La relation s'appelle "user" mais utilise adminUserId
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    console.log(`📊 ${logs.length} logs récupérés`);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs', details: err.message },
      { status: 500 }
    );
  }
}