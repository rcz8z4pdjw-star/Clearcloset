import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Simulated stock prices (in a real app, this would come from a stock API)
const stockData: Record<string, { name: string; price: number; change: number }> = {
  AAPL: { name: 'Apple Inc.', price: 178.52, change: 1.33 },
  GOOGL: { name: 'Alphabet Inc.', price: 141.80, change: -0.84 },
  MSFT: { name: 'Microsoft Corp.', price: 378.91, change: 1.22 },
  AMZN: { name: 'Amazon.com Inc.', price: 178.25, change: 1.83 },
  TSLA: { name: 'Tesla Inc.', price: 175.34, change: -3.13 },
  NVDA: { name: 'NVIDIA Corp.', price: 721.28, change: 2.19 },
  META: { name: 'Meta Platforms', price: 485.12, change: 1.75 },
  DIS: { name: 'Walt Disney Co.', price: 110.45, change: -1.91 },
  NFLX: { name: 'Netflix Inc.', price: 478.23, change: 1.20 },
  JPM: { name: 'JPMorgan Chase', price: 182.45, change: 0.85 },
};

// Initial virtual cash for new users
const INITIAL_CASH = 10000;

// Get user's portfolio
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, we'd have Portfolio and PortfolioHolding models
    // For now, we'll return simulated data based on user preferences stored in user profile

    // Get user's portfolio data from metadata or create default
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Simulated portfolio data (in production, this would be from database)
    const holdings = [
      { symbol: 'AAPL', shares: 10, avgCost: 165.00 },
      { symbol: 'MSFT', shares: 5, avgCost: 350.00 },
      { symbol: 'GOOGL', shares: 8, avgCost: 135.00 },
    ];

    // Calculate current values
    const portfolioHoldings = holdings.map((h) => {
      const stock = stockData[h.symbol];
      const currentPrice = stock?.price || 0;
      const value = h.shares * currentPrice;
      const cost = h.shares * h.avgCost;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

      return {
        ...h,
        name: stock?.name || 'Unknown',
        currentPrice,
        value,
        gain,
        gainPercent,
        dayChange: stock?.change || 0,
      };
    });

    const totalValue = portfolioHoldings.reduce((sum, h) => sum + h.value, 0);
    const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0);
    const cashBalance = INITIAL_CASH - totalCost;

    return NextResponse.json({
      holdings: portfolioHoldings,
      cashBalance: Math.max(0, cashBalance),
      totalValue,
      totalCost,
      totalGain: totalValue - totalCost,
      totalGainPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}

// Execute a trade (buy or sell)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, symbol, shares } = body;

    if (!action || !symbol || !shares) {
      return NextResponse.json(
        { error: 'Missing required fields: action, symbol, shares' },
        { status: 400 }
      );
    }

    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "buy" or "sell"' },
        { status: 400 }
      );
    }

    const stock = stockData[symbol.toUpperCase()];
    if (!stock) {
      return NextResponse.json(
        { error: 'Stock symbol not found' },
        { status: 404 }
      );
    }

    const shareCount = parseInt(shares);
    if (isNaN(shareCount) || shareCount <= 0) {
      return NextResponse.json(
        { error: 'Invalid share count' },
        { status: 400 }
      );
    }

    const tradeValue = shareCount * stock.price;

    // In a real implementation:
    // 1. Check if user has enough cash (for buy) or shares (for sell)
    // 2. Update portfolio holdings in database
    // 3. Record transaction history
    // 4. Update cash balance

    // For now, return simulated success
    const transaction = {
      id: `tx_${Date.now()}`,
      userId: user.id,
      action,
      symbol: symbol.toUpperCase(),
      shares: shareCount,
      price: stock.price,
      total: tradeValue,
      executedAt: new Date().toISOString(),
    };

    // Award XP for trading activity (learning by doing)
    const xpReward = action === 'buy' ? 10 : 5;
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpReward } },
    });

    return NextResponse.json({
      success: true,
      transaction,
      xpEarned: xpReward,
      message: `Successfully ${action === 'buy' ? 'bought' : 'sold'} ${shareCount} shares of ${symbol.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Trade error:', error);
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    );
  }
}

// Get stock quotes
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols)) {
      // Return all stocks
      return NextResponse.json({
        stocks: Object.entries(stockData).map(([symbol, data]) => ({
          symbol,
          ...data,
          changePercent: data.change,
        })),
      });
    }

    const quotes = symbols
      .map((s: string) => s.toUpperCase())
      .filter((s: string) => stockData[s])
      .map((symbol: string) => ({
        symbol,
        ...stockData[symbol],
        changePercent: stockData[symbol].change,
      }));

    return NextResponse.json({ stocks: quotes });
  } catch (error) {
    console.error('Get quotes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock quotes' },
      { status: 500 }
    );
  }
}
