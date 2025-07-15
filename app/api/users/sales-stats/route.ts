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

    // Récupérer les utilisateurs vendeurs de l'événement via la relation many-to-many
    const vendors = await prisma.$queryRaw<[{ id: string; name: string; email: string; role: string }]>`
      SELECT u.id, u.name, u.email, u.role
      FROM "User" u
      INNER JOIN "EventUser" eu ON u.id = eu."userId"
      WHERE eu."eventId" = ${eventId} AND u.role = 'VENDEUR'
    `;

    // Récupérer les statistiques de ventes par vendeur via SQL direct
    const salesByVendor = await prisma.$queryRaw<[{ vendeurId: string; count: bigint }]>`
      SELECT sh."vendeurId", COUNT(*) as count
      FROM "ScanHistory" sh
      WHERE sh."eventId" = ${eventId} 
        AND sh.action = 'SOLD' 
        AND sh."vendeurId" IS NOT NULL
      GROUP BY sh."vendeurId"
    `;

    // Créer un map des ventes par vendeur
    const salesMap = new Map<string, number>();
    salesByVendor.forEach(sale => {
      if (sale.vendeurId) {
        salesMap.set(sale.vendeurId, Number(sale.count));
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