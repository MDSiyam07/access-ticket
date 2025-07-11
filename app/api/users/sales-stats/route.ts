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

    // Récupérer les utilisateurs vendeurs de l'événement
    const vendors = await prisma.user.findMany({
      where: {
        eventId: eventId,
        role: 'VENDEUR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Récupérer les statistiques de ventes par vendeur
    const salesByVendor = await prisma.scanHistory.groupBy({
      by: ['vendeurId'],
      where: {
        eventId: eventId,
        action: 'SOLD',
        vendeurId: { not: null },
      },
      _count: { _all: true },
    });

    // Créer un map des ventes par vendeur
    const salesMap = new Map<string, number>();
    salesByVendor.forEach(sale => {
      if (sale.vendeurId && sale._count && typeof sale._count._all === 'number') {
        salesMap.set(sale.vendeurId, sale._count._all);
      }
    });

    // Combiner les données
    const userSalesStats = vendors.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      totalSales: salesMap.get(user.id) || 0, // Vraies ventes par vendeur
    }));

    // Calculer le total des ventes
    const totalSales = Array.from(salesMap.values()).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      userSalesStats,
      totalSales,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de ventes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 