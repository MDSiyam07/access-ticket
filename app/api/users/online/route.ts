import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'événement est requis.' },
        { status: 400 }
      );
    }

    // Récupérer le nombre d'utilisateurs pour cet événement via la relation many-to-many
    const onlineUsersResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "User" u
      INNER JOIN "EventUser" eu ON u.id = eu."userId"
      WHERE eu."eventId" = ${eventId}
    `;

    const onlineUsers = Number(onlineUsersResult[0].count);

    // Récupérer aussi les utilisateurs par rôle pour plus de détails
    const usersByRole = await prisma.$queryRaw<[{ role: string; count: bigint }]>`
      SELECT u.role, COUNT(*) as count
      FROM "User" u
      INNER JOIN "EventUser" eu ON u.id = eu."userId"
      WHERE eu."eventId" = ${eventId}
      GROUP BY u.role
    `;

    return NextResponse.json({
      success: true,
      onlineUsers,
      usersByRole: usersByRole.map(group => ({
        role: group.role,
        count: Number(group.count),
      })),
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs connectés:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 