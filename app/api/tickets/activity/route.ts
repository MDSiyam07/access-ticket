import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Récupérer les 10 dernières activités de scan
    const recentActivity = await prisma.scanHistory.findMany({
      take: 10,
      orderBy: {
        scannedAt: 'desc',
      },
      include: {
        ticket: {
          select: {
            number: true,
          },
        },
      },
    });

    // Formater les données pour l'affichage
    const formattedActivity = recentActivity.map((activity) => ({
      id: activity.id,
      ticketNumber: activity.ticket.number,
      action: activity.action,
      scannedAt: activity.scannedAt,
      timeAgo: getTimeAgo(activity.scannedAt),
    }));

    return NextResponse.json({
      success: true,
      activity: formattedActivity,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'activité:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'À l\'instant';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Il y a ${minutes} min`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Il y a ${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `Il y a ${days}j`;
  }
} 