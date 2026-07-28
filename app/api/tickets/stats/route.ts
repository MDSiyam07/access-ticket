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

    // Statistiques globales
    const total = await prisma.ticket.count({
      where: { eventId: eventId },
    });

    const entered = await prisma.ticket.count({
      where: { 
        eventId: eventId,
        status: 'ENTERED'
      },
    });

    const exited = await prisma.ticket.count({
      where: { 
        eventId: eventId,
        status: 'EXITED'
      },
    });

    const pending = await prisma.ticket.count({
      where: { 
        eventId: eventId,
        status: 'PENDING'
      },
    });

    // "vendus" doit être un total cumulatif : un billet reste compté même après
    // son passage en ENTERED/EXITED. On se base donc sur soldAt (renseigné une
    // seule fois, à la vente, et jamais réinitialisé) plutôt que sur le statut
    // courant (qui, lui, change à chaque scan et faisait redescendre le compteur).
    const vendus = await prisma.ticket.count({
      where: {
        eventId: eventId,
        soldAt: { not: null }
      },
    });

    // Billets vendus mais pas encore scannés à l'entrée (statut encore VENDU).
    // Contrairement à "vendus" ci-dessus, celui-ci diminue légitimement au fil
    // des entrées : il sert à afficher "vendus en attente d'entrée".
    const awaitingEntry = await prisma.ticket.count({
      where: {
        eventId: eventId,
        status: 'VENDU'
      },
    });

    // Statistiques par type de billet
    const ticketTypes = ['NORMAL', 'VIP', 'ARTISTE', 'STAFF'] as const;

    const [statsByType, vendusByType, awaitingEntryByType] = await Promise.all([
      Promise.all(ticketTypes.map(ticketType =>
        prisma.ticket.groupBy({
          by: ['status'],
          where: { eventId, ticketType },
          _count: { status: true },
        })
      )),
      Promise.all(ticketTypes.map(ticketType =>
        prisma.ticket.count({
          where: { eventId, ticketType, soldAt: { not: null } },
        })
      )),
      Promise.all(ticketTypes.map(ticketType =>
        prisma.ticket.count({
          where: { eventId, ticketType, status: 'VENDU' },
        })
      )),
    ]);

    // Formater les stats par type
    interface TypeStats {
      status: string;
      _count: { status: number };
    }

    const formatStatsByType = (
      typeStats: TypeStats[],
      typeName: string,
      vendusCount: number,
      awaitingEntryCount: number
    ) => {
      const stats = {
        total: 0,
        entered: 0,
        exited: 0,
        pending: 0,
        vendus: vendusCount,
        awaitingEntry: awaitingEntryCount,
      };

      typeStats.forEach(stat => {
        const count = stat._count.status;
        stats.total += count;

        switch (stat.status) {
          case 'ENTERED':
            stats.entered += count;
            break;
          case 'EXITED':
            stats.exited += count;
            break;
          case 'PENDING':
            stats.pending += count;
            break;
        }
      });

      return {
        type: typeName,
        ...stats,
      };
    };

    const statsByTicketType = {
      normal: formatStatsByType(statsByType[0], 'NORMAL', vendusByType[0], awaitingEntryByType[0]),
      vip: formatStatsByType(statsByType[1], 'VIP', vendusByType[1], awaitingEntryByType[1]),
      artiste: formatStatsByType(statsByType[2], 'ARTISTE', vendusByType[2], awaitingEntryByType[2]),
      staff: formatStatsByType(statsByType[3], 'STAFF', vendusByType[3], awaitingEntryByType[3]),
    };

    return NextResponse.json({
      success: true,
      total,
      entered,
      exited,
      pending,
      vendus,
      awaitingEntry,
      byType: statsByTicketType,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 