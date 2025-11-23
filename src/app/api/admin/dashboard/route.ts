import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    todayOrders: 5,
    pendingOrders: 2,
    activeOrders: 3,
    todayRevenue: 150.50,
    revenueChange: 15.5,
    totalRevenue: 25000,
    averageTicket: 22.50,
    totalOrders: 1111,
    uniqueCustomers: 850,
    categoryRevenue: [],
    topProducts: [
      { id: '1', name: 'Ebi Fry', orderCount: 25 },
      { id: '2', name: 'Sushi Combo', orderCount: 18 },
      { id: '3', name: 'Temaki', orderCount: 15 },
    ],
    recentOrders: [
      {
        id: '1',
        orderNumber: 1001,
        customerName: 'João Silva',
        total: 45.90,
        status: 'PENDING',
        createdAt: new Date(),
      },
    ],
  });
}