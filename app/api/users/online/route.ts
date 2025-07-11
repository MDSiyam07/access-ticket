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

    // Récupérer le nombre d'utilisateurs pour cet événement
    const onlineUsers = await prisma.user.count({
      where: {
        eventId: eventId,
        // On pourrait ajouter un champ lastSeen pour détecter les utilisateurs vraiment actifs
        // pour l'instant on compte tous les utilisateurs de l'événement
      },
    });

    // Récupérer aussi les utilisateurs par rôle pour plus de détails
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      where: {
        eventId: eventId,
      },
      _count: {
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      onlineUsers,
      usersByRole: usersByRole.map(group => ({
        role: group.role,
        count: group._count.role,
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