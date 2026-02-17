// lib/auth/middleware.ts
import { NextResponse } from 'next/server';
import { extractToken, verifyToken, JWTPayload } from './jwt';
import { prisma } from '@/lib/prisma';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

/**
 * Middleware pour protéger les routes API
 */
export async function requireAuth(
  request: Request
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json(
      { error: 'Non authentifié' },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Token invalide ou expiré' },
      { status: 401 }
    );
  }

  // Vérifier que l'utilisateur existe toujours
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Utilisateur non trouvé' },
      { status: 401 }
    );
  }

  return { user: payload };
}

/**
 * Middleware pour vérifier les droits admin
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Erreur d'authentification
  }

  const { user } = authResult;

  if (user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Accès refusé - droits administrateur requis' },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Utilitaire pour extraire l'utilisateur d'une requête
 */
export async function getAuthUser(
  request: Request
): Promise<JWTPayload | null> {
  const token = extractToken(request);
  if (!token) return null;

  return await verifyToken(token);
}