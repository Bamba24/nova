import { prisma } from '@/lib/prisma';

export type AdminAction = 
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ROLE_CHANGE'
  | 'PLANNING_CREATE'
  | 'PLANNING_DELETE'
  | 'SLOT_CREATE'
  | 'SLOT_DELETE';

export type TargetType = 
  | 'USER'
  | 'PLANNING'
  | 'SLOT'
  | 'User'
  | 'Planning'
  | 'Slot'

interface CreateLogParams {
  userId: string;
  action: AdminAction;
  targetType: TargetType;
  targetId?: string | null;
  details?: object | null;
  ipAddress?: string | null;
}

export async function createAdminLog({
  userId,
  action,
  targetType,
  targetId = null,
  details = null,
  ipAddress = null,
}: CreateLogParams) {
  try {
    await prisma.adminLog.create({
      data: {
        adminUserId: userId,
        action,
        targetType,
        targetId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
      },
    });
    console.log(`📝 Log: ${action} par ${userId}`);
  } catch (error) {
    console.error('❌ Erreur log:', error);
  }
}

export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp;
  
  return 'unknown';
}