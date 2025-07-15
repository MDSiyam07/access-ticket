import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer les utilisateurs d'un événement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const users = await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, u.role, u."createdAt"
      FROM "User" u
      INNER JOIN "EventUser" eu ON u.id = eu."userId"
      WHERE eu."eventId" = ${eventId}
      ORDER BY u."createdAt" ASC
    `;

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 