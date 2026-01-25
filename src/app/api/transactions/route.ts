import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';

// Get user's transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = { userId: user.id };

    if (category && category !== 'All') {
      where.categoryId = category;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }

    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }

    // Get transactions
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
        include: {
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate summary
    const summary = await prisma.transaction.groupBy({
      by: ['type'],
      where: { userId: user.id },
      _sum: { amount: true },
    });

    const income = summary.find(s => s.type === 'income')?._sum.amount || 0;
    const expenses = Math.abs(summary.find(s => s.type === 'expense')?._sum.amount || 0);
    const netBalance = income - expenses;

    // Format transactions
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      date: tx.date,
      category: tx.category ? {
        id: tx.category.id,
        name: tx.category.name,
        icon: tx.category.icon,
        color: tx.category.color,
      } : null,
      notes: tx.notes,
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
      summary: {
        income,
        expenses,
        netBalance,
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

// Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description, amount, type, categoryId, date, notes } = body;

    if (!description || amount === undefined || !type) {
      return NextResponse.json({ error: 'Description, amount, and type are required' }, { status: 400 });
    }

    // Validate type
    if (!['income', 'expense', 'transfer'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        description,
        amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        type,
        categoryId: categoryId || null,
        date: date ? new Date(date) : new Date(),
        notes,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    // Award XP for tracking
    await awardXP(user.id, 5, 'Tracked transaction', 'transaction_logged');

    // Check for tracking achievements
    const transactionCount = await prisma.transaction.count({
      where: { userId: user.id },
    });

    if (transactionCount === 1) {
      await awardXP(user.id, 25, 'First transaction tracked', 'first_transaction');
    } else if (transactionCount === 50) {
      await awardXP(user.id, 100, 'Tracked 50 transactions', 'transaction_milestone');
    } else if (transactionCount === 100) {
      await awardXP(user.id, 200, 'Tracked 100 transactions', 'transaction_milestone');
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        category: transaction.category,
      },
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

// Update a transaction
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, description, amount, type, categoryId, date, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(amount !== undefined && {
          amount: type === 'expense' || existing.type === 'expense'
            ? -Math.abs(amount)
            : Math.abs(amount),
        }),
        ...(type && { type }),
        ...(categoryId !== undefined && { categoryId }),
        ...(date && { date: new Date(date) }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.transaction.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete transaction
    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
