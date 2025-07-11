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

    // Vérifier que l'événement existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé.' },
        { status: 404 }
      );
    }

    // Compter les tickets par statut pour cet événement
    const [total, pending, entered, exited, vendus] = await Promise.all([
      prisma.ticket.count({ where: { eventId } }),
      prisma.ticket.count({ where: { status: 'PENDING', eventId } }),
      prisma.ticket.count({ where: { status: 'ENTERED', eventId } }),
      prisma.ticket.count({ where: { status: 'EXITED', eventId } }),
      prisma.ticket.count({ where: { soldAt: { not: null }, eventId } }),
    ]);

    return NextResponse.json({
      total,
      pending,
      entered,
      exited,
      vendus,
      imported: total, // Pour compatibilité avec l'interface
      duplicates: 0, // Cette valeur n'est pas disponible dans les stats générales
      eventName: event.name,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 