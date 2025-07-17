import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { ticketNumber, eventId } = await request.json();

    if (!ticketNumber || !eventId) {
      return NextResponse.json(
        { error: 'Le numéro de ticket et l\'ID de l\'événement sont requis' },
        { status: 400 }
      );
    }

    // Rechercher le ticket dans la base de données
    const ticket = await prisma.ticket.findFirst({
      where: {
        number: ticketNumber,
        eventId: eventId,
      },
      include: {
        scanHistory: {
          orderBy: {
            scannedAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { 
          found: false,
          message: 'Ce ticket n\'existe pas dans la base de données pour cet événement'
        },
        { status: 200 }
      );
    }

    // Déterminer le statut du ticket
    let lastAction = null;

    if (ticket.scanHistory.length > 0) {
      const lastScan = ticket.scanHistory[0];
      lastAction = {
        action: lastScan.action,
        scannedAt: lastScan.scannedAt,
        vendeurId: lastScan.vendeurId
      };
    }

    return NextResponse.json({
      found: true,
      ticket: {
        id: ticket.id,
        number: ticket.number,
        status: ticket.status,
        ticketType: ticket.ticketType,
        scannedAt: ticket.scannedAt,
        soldAt: ticket.soldAt,
        entryType: ticket.entryType,
        createdAt: ticket.createdAt,
        lastAction: lastAction
      }
    });

  } catch (error) {
    console.error('Erreur lors de la recherche du ticket:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 