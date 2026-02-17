import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const [totalUsers, totalPlannings, totalSlots, activeUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.planning.count(),
        prisma.slot.count(),
        prisma.user.count({
          where: {
            plannings: {
              some: {},
            },
          },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPlannings,
        totalSlots,
        activeUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}