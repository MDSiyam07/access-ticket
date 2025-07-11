import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!eventId) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'événement est requis.' },
        { status: 400 }
      );
    }

    // Récupérer l'historique de scan pour cet événement
    const recentActivity = await prisma.scanHistory.findMany({
      where: {
        eventId: eventId
      },
      take: Math.min(limit, 100), // Limiter à 100 maximum
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

    // Récupérer les informations des vendeurs séparément
    const vendeurIds = recentActivity
      .map(activity => {
        const record = activity as unknown as { vendeurId?: string };
        return record.vendeurId;
      })
      .filter(id => id !== null && id !== undefined) as string[];

    let vendeursMap = new Map();
    if (vendeurIds.length > 0) {
      const vendeurs = await prisma.user.findMany({
        where: {
          id: { in: vendeurIds }
        },
        select: {
          id: true,
          email: true,
          name: true,
        }
      });
      vendeursMap = new Map(vendeurs.map(v => [v.id, v]));
    }

    // Formater les données pour l'affichage
    const formattedActivity = recentActivity.map((activity) => {
      const record = activity as unknown as { vendeurId?: string };
      const vendeurId = record.vendeurId;
      const vendeur = vendeurId ? vendeursMap.get(vendeurId) : null;
      
      return {
        id: activity.id,
        ticketNumber: activity.ticket.number,
        action: activity.action,
        scannedAt: activity.scannedAt,
        timeAgo: getTimeAgo(activity.scannedAt),
        operator: vendeur?.email || null,
        operatorName: vendeur?.name || null,
      };
    });

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