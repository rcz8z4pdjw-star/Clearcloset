import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';

// Get user's budget
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);

    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    // Get budget categories
    const categories = await prisma.budgetCategory.findMany({
      where: { userId: user.id },
      include: {
        budgetAllocations: {
          where: { month },
        },
      },
      orderBy: { order: 'asc' },
    });

    // Get transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate spending per category
    const spendingByCategory: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.categoryId && tx.type === 'expense') {
        spendingByCategory[tx.categoryId] = (spendingByCategory[tx.categoryId] || 0) + Math.abs(tx.amount);
      }
    });

    // Format categories with spending
    const budgetCategories = categories.map(cat => {
      const allocation = cat.budgetAllocations[0];
      const spent = spendingByCategory[cat.id] || 0;
      const budgeted = allocation?.amount || 0;

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budgeted,
        spent,
        remaining: budgeted - spent,
        percentage: budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0,
        overBudget: spent > budgeted,
        transactionCount: transactions.filter(t => t.categoryId === cat.id).length,
      };
    });

    // Calculate totals
    const totalBudgeted = budgetCategories.reduce((sum, c) => sum + c.budgeted, 0);
    const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0);
    const totalRemaining = totalBudgeted - totalSpent;

    // Get income for the month
    const incomeTotal = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Recent transactions
    const recentTransactions = transactions.slice(0, 10).map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      categoryId: tx.categoryId,
      categoryName: categories.find(c => c.id === tx.categoryId)?.name || 'Uncategorized',
      date: tx.date,
    }));

    return NextResponse.json({
      month,
      categories: budgetCategories,
      totals: {
        budgeted: totalBudgeted,
        spent: totalSpent,
        remaining: totalRemaining,
        income: incomeTotal,
        savingsRate: incomeTotal > 0 ? Math.round(((incomeTotal - totalSpent) / incomeTotal) * 100) : 0,
      },
      transactions: recentTransactions,
      overBudgetCount: budgetCategories.filter(c => c.overBudget).length,
    });
  } catch (error) {
    console.error('Get budget error:', error);
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 });
  }
}

// Create or update budget category
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, categoryId, name, icon, color, amount, month } = body;

    if (action === 'create_category') {
      if (!name) {
        return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
      }

      // Get max order
      const maxOrder = await prisma.budgetCategory.aggregate({
        where: { userId: user.id },
        _max: { order: true },
      });

      const category = await prisma.budgetCategory.create({
        data: {
          userId: user.id,
          name,
          icon: icon || 'dollar',
          color: color || 'bg-gray-500',
          order: (maxOrder._max.order || 0) + 1,
        },
      });

      // Award XP for setting up budget
      const categoryCount = await prisma.budgetCategory.count({ where: { userId: user.id } });
      if (categoryCount === 1) {
        await awardXP(user.id, 50, 'Started budgeting', 'budget_started');
      }

      return NextResponse.json({ success: true, category });
    }

    if (action === 'set_allocation') {
      if (!categoryId || !amount || !month) {
        return NextResponse.json({ error: 'Category ID, amount, and month are required' }, { status: 400 });
      }

      // Upsert allocation
      const allocation = await prisma.budgetAllocation.upsert({
        where: {
          categoryId_month: {
            categoryId,
            month,
          },
        },
        update: { amount },
        create: {
          categoryId,
          month,
          amount,
        },
      });

      return NextResponse.json({ success: true, allocation });
    }

    if (action === 'add_transaction') {
      const { description, transactionAmount, type, date } = body;

      if (!description || !transactionAmount || !type) {
        return NextResponse.json({ error: 'Description, amount, and type are required' }, { status: 400 });
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: user.id,
          description,
          amount: type === 'expense' ? -Math.abs(transactionAmount) : Math.abs(transactionAmount),
          type,
          categoryId: categoryId || null,
          date: date ? new Date(date) : new Date(),
        },
      });

      // Award XP for tracking
      await awardXP(user.id, 5, 'Tracked transaction', 'transaction_logged');

      return NextResponse.json({ success: true, transaction });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Budget action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

// Update budget category
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, name, icon, color, order } = body;

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    await prisma.budgetCategory.update({
      where: { id: categoryId },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// Delete budget category
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.budgetCategory.findFirst({
      where: { id: categoryId, userId: user.id },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Delete allocations first
    await prisma.budgetAllocation.deleteMany({ where: { categoryId } });

    // Unlink transactions (don't delete them)
    await prisma.transaction.updateMany({
      where: { categoryId },
      data: { categoryId: null },
    });

    // Delete category
    await prisma.budgetCategory.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
