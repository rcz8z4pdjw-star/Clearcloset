import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasAnyRole } from '@/lib/auth';
import { createAuditLog, AuditActions } from '@/lib/audit';
import { createNotification, notifyTradeApproved, notifyTradeRejected } from '@/lib/notifications';

// Create a trade request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { portfolioId, action, symbol, quantity, price, thesis, riskAnalysis } = body;

    // Validate required fields
    if (!portfolioId || !action || !symbol || !quantity || !thesis) {
      return NextResponse.json(
        { error: 'Missing required fields: portfolioId, action, symbol, quantity, thesis' },
        { status: 400 }
      );
    }

    // Check user owns the portfolio
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId: user.id,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // For sell orders, check if user has enough holdings
    if (action === 'sell') {
      const holding = await prisma.holding.findUnique({
        where: {
          portfolioId_symbol: {
            portfolioId,
            symbol,
          },
        },
      });

      if (!holding || holding.quantity < quantity) {
        return NextResponse.json(
          { error: 'Insufficient holdings for sell order' },
          { status: 400 }
        );
      }
    }

    // Create trade request
    const tradeRequest = await prisma.tradeRequest.create({
      data: {
        portfolioId,
        userId: user.id,
        action,
        symbol,
        quantity,
        price,
        thesis,
        riskAnalysis,
        status: 'PENDING',
      },
    });

    // Log the trade request
    await createAuditLog({
      userId: user.id,
      action: AuditActions.TRADE_REQUESTED,
      entityType: 'TradeRequest',
      entityId: tradeRequest.id,
      newValues: { action, symbol, quantity, price, thesis },
    });

    // Notify CIO/mentors about pending trade
    const cioUsers = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: ['CIO', 'MENTOR'] },
          },
        },
        isActive: true,
      },
    });

    for (const cio of cioUsers) {
      await createNotification({
        userId: cio.id,
        type: 'APPROVAL',
        title: 'New Trade Request',
        message: `${user.firstName} ${user.lastName} has requested to ${action} ${quantity} shares of ${symbol}.`,
        link: `/dashboard/ic-oversight/trades/${tradeRequest.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      tradeRequest,
    });
  } catch (error) {
    console.error('Trade request error:', error);
    return NextResponse.json(
      { error: 'Failed to create trade request' },
      { status: 500 }
    );
  }
}

// Get trade requests (for CIO/admin or own requests)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const portfolioId = searchParams.get('portfolioId');

    const isCIO = hasAnyRole(user, ['CIO', 'ADMIN', 'COMPLIANCE']);

    const where: any = {};

    if (!isCIO) {
      // Regular users can only see their own trades
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (portfolioId) {
      where.portfolioId = portfolioId;
    }

    const tradeRequests = await prisma.tradeRequest.findMany({
      where,
      include: {
        portfolio: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tradeRequests });
  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade requests' },
      { status: 500 }
    );
  }
}
