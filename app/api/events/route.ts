import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer tous les événements
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Récupérer les comptes pour chaque événement
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const [ticketCount, userCount] = await Promise.all([
          prisma.ticket.count({
            where: { eventId: event.id },
          }),
          prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count
            FROM "EventUser"
            WHERE "eventId" = ${event.id}
          `,
        ]);

        return {
          ...event,
          _count: {
            tickets: ticketCount,
            users: Number(userCount[0].count),
          },
        };
      })
    );

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel événement
export async function POST(request: NextRequest) {
  try {
    const { name, description, startDate, endDate } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom de l\'événement est requis' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un événement
export async function PUT(request: NextRequest) {
  try {
    const { id, name, description, startDate, endDate, isActive } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de l'événement est requis" },
        { status: 400 }
      );
    }
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: typeof isActive === 'boolean' ? isActive : undefined,
      },
    });
    return NextResponse.json(event);
  } catch (error) {
    console.error('Erreur lors de la modification de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;
    
    console.log('DELETE /api/events - Corps de la requête:', body);
    console.log('ID:', id);
    console.log('Action:', action);
    
    if (!id) {
      return NextResponse.json(
        { error: "L'identifiant de l'événement est requis" },
        { status: 400 }
      );
    }

    // Vérifier s'il y a des tickets ou utilisateurs liés
    const [ticketCount, userCount] = await Promise.all([
      prisma.ticket.count({
        where: { eventId: id },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM "EventUser"
        WHERE "eventId" = ${id}
      `,
    ]);

    const eventWithCounts = {
      id,
      _count: {
        tickets: ticketCount,
        users: Number(userCount[0].count),
      },
    };

    console.log('Événement trouvé:', eventWithCounts);

    // Si action = 'cleanup', supprimer toutes les données de l'événement
    if (action === 'cleanup') {
      console.log('Nettoyage des données de l\'événement');
      
      // Supprimer d'abord l'historique de scan des tickets de cet événement
      const deletedScanHistory = await prisma.scanHistory.deleteMany({
        where: {
          ticket: {
            eventId: id
          }
        }
      });
      console.log('Historique de scan supprimé:', deletedScanHistory);

      // Supprimer tous les tickets de cet événement
      const deletedTickets = await prisma.ticket.deleteMany({
        where: { eventId: id }
      });
      console.log('Tickets supprimés:', deletedTickets);

      // Supprimer les liens EventUser (mais pas les utilisateurs eux-mêmes)
      await prisma.$executeRaw`
        DELETE FROM "EventUser"
        WHERE "eventId" = ${id}
      `;
      console.log('Liens EventUser supprimés');

      // Supprimer l'événement
      await prisma.event.delete({ where: { id } });
      console.log('Événement supprimé');
      
      return NextResponse.json({ 
        success: true,
        message: `Événement supprimé avec ${eventWithCounts._count.tickets} tickets et leur historique de scan`
      });
    }

    // Mode suppression normale - vérifier s'il y a des données associées
    if (eventWithCounts._count.tickets > 0 || eventWithCounts._count.users > 0) {
      console.log('Données associées trouvées, refus de suppression');
      return NextResponse.json(
        { 
          error: 'Impossible de supprimer cet événement',
          details: `L'événement contient ${eventWithCounts._count.tickets} tickets et ${eventWithCounts._count.users} utilisateurs. Utilisez l'option de suppression complète pour supprimer l'événement et toutes ses données.`
        },
        { status: 400 }
      );
    }

    // Supprimer l'événement s'il n'a pas de données associées
    await prisma.event.delete({ where: { id } });
    console.log('Événement supprimé (mode normal)');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 