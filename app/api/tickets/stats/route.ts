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

    const vendus = await prisma.ticket.count({
      where: { 
        eventId: eventId,
        status: 'VENDU'
      },
    });

    // Statistiques par type de billet
    const statsByType = await Promise.all([
      // NORMAL
      prisma.ticket.groupBy({
        by: ['status'],
        where: { 
          eventId: eventId,
          ticketType: 'NORMAL'
        },
        _count: { status: true },
      }),
      // VIP
      prisma.ticket.groupBy({
        by: ['status'],
        where: { 
          eventId: eventId,
          ticketType: 'VIP'
        },
        _count: { status: true },
      }),
      // ARTISTE
      prisma.ticket.groupBy({
        by: ['status'],
        where: { 
          eventId: eventId,
          ticketType: 'ARTISTE'
        },
        _count: { status: true },
      }),
      // STAFF
      prisma.ticket.groupBy({
        by: ['status'],
        where: { 
          eventId: eventId,
          ticketType: 'STAFF'
        },
        _count: { status: true },
      }),
    ]);

    // Formater les stats par type
    interface TypeStats {
      status: string;
      _count: { status: number };
    }

    const formatStatsByType = (typeStats: TypeStats[], typeName: string) => {
      const stats = {
        total: 0,
        entered: 0,
        exited: 0,
        pending: 0,
        vendus: 0,
      };

      typeStats.forEach(stat => {
        const count = stat._count.status;
        stats.total += count;
        
        switch (stat.status) {
          case 'ENTERED':
          case 'EXITED':
            stats.entered += count;
            break;
          case 'EXITED':
            stats.exited += count;
            break;
          case 'PENDING':
            stats.pending += count;
            break;
          case 'VENDU':
            stats.vendus += count;
            break;
        }
      });

      return {
        type: typeName,
        ...stats,
      };
    };

    const statsByTicketType = {
      normal: formatStatsByType(statsByType[0], 'NORMAL'),
      vip: formatStatsByType(statsByType[1], 'VIP'),
      artiste: formatStatsByType(statsByType[2], 'ARTISTE'),
      staff: formatStatsByType(statsByType[3], 'STAFF'),
    };

    return NextResponse.json({
      success: true,
      total,
      entered,
      exited,
      pending,
      vendus,
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