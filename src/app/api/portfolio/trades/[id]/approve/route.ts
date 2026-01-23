import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasAnyRole } from '@/lib/auth';
import { createAuditLog, AuditActions } from '@/lib/audit';
import { notifyTradeApproved, notifyTradeRejected } from '@/lib/notifications';
import { sendTradeApprovalEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only CIO, ADMIN, or COMPLIANCE can approve trades
    if (!hasAnyRole(user, ['CIO', 'ADMIN', 'COMPLIANCE', 'MENTOR'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: tradeId } = await params;
    const body = await request.json();
    const { decision, comments } = body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get the trade request
    const tradeRequest = await prisma.tradeRequest.findUnique({
      where: { id: tradeId },
      include: {
        portfolio: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!tradeRequest) {
      return NextResponse.json({ error: 'Trade request not found' }, { status: 404 });
    }

    if (tradeRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Trade request has already been processed' },
        { status: 400 }
      );
    }

    // Create the approval record
    const approval = await prisma.tradeApproval.create({
      data: {
        tradeRequestId: tradeId,
        approverId: user.id,
        decision,
        comments,
      },
    });

    // Update trade request status
    const newStatus = decision === 'approved' ? 'APPROVED' : 'REJECTED';

    await prisma.tradeRequest.update({
      where: { id: tradeId },
      data: {
        status: newStatus,
        ...(decision === 'approved' && {
          executedAt: new Date(),
          executedPrice: tradeRequest.price,
        }),
      },
    });

    // If approved, execute the trade (update holdings)
    if (decision === 'approved') {
      const { action, symbol, quantity, price } = tradeRequest;
      const portfolioId = tradeRequest.portfolioId;

      if (action === 'buy') {
        // Upsert holding for buy
        const existingHolding = await prisma.holding.findUnique({
          where: {
            portfolioId_symbol: { portfolioId, symbol },
          },
        });

        if (existingHolding) {
          // Update existing holding
          const newQuantity = existingHolding.quantity + quantity;
          const newAverageCost =
            (existingHolding.quantity * existingHolding.averageCost +
              quantity * (price || 0)) /
            newQuantity;

          await prisma.holding.update({
            where: { id: existingHolding.id },
            data: {
              quantity: newQuantity,
              averageCost: newAverageCost,
              currentPrice: price,
            },
          });
        } else {
          // Create new holding
          await prisma.holding.create({
            data: {
              portfolioId,
              symbol,
              name: symbol, // Would fetch from market data in production
              quantity,
              averageCost: price || 0,
              currentPrice: price,
            },
          });
        }

        // Log holding update
        await createAuditLog({
          userId: user.id,
          action: AuditActions.HOLDING_UPDATED,
          entityType: 'Holding',
          entityId: portfolioId,
          newValues: { action: 'buy', symbol, quantity, price },
        });
      } else if (action === 'sell') {
        // Update holding for sell
        const holding = await prisma.holding.findUnique({
          where: {
            portfolioId_symbol: { portfolioId, symbol },
          },
        });

        if (holding) {
          const newQuantity = holding.quantity - quantity;

          if (newQuantity <= 0) {
            // Remove holding if sold completely
            await prisma.holding.delete({
              where: { id: holding.id },
            });
          } else {
            // Update holding
            await prisma.holding.update({
              where: { id: holding.id },
              data: {
                quantity: newQuantity,
                currentPrice: price,
              },
            });
          }

          // Log holding update
          await createAuditLog({
            userId: user.id,
            action: AuditActions.HOLDING_UPDATED,
            entityType: 'Holding',
            entityId: portfolioId,
            newValues: { action: 'sell', symbol, quantity, price },
          });
        }
      }

      // Log trade execution
      await createAuditLog({
        userId: user.id,
        action: AuditActions.TRADE_EXECUTED,
        entityType: 'TradeRequest',
        entityId: tradeId,
        newValues: { executedAt: new Date(), executedPrice: price },
      });

      // Notify the user
      await notifyTradeApproved(
        tradeRequest.portfolio.userId,
        symbol,
        action
      );

      // Send email
      await sendTradeApprovalEmail(
        tradeRequest.portfolio.user.email,
        `${tradeRequest.portfolio.user.firstName} ${tradeRequest.portfolio.user.lastName}`,
        action,
        symbol,
        quantity,
        'approved'
      );
    } else {
      // Rejected
      await createAuditLog({
        userId: user.id,
        action: AuditActions.TRADE_REJECTED,
        entityType: 'TradeRequest',
        entityId: tradeId,
        newValues: { comments },
      });

      await notifyTradeRejected(
        tradeRequest.portfolio.userId,
        tradeRequest.symbol,
        tradeRequest.action,
        comments
      );

      await sendTradeApprovalEmail(
        tradeRequest.portfolio.user.email,
        `${tradeRequest.portfolio.user.firstName} ${tradeRequest.portfolio.user.lastName}`,
        tradeRequest.action,
        tradeRequest.symbol,
        tradeRequest.quantity,
        'rejected'
      );
    }

    // Log the approval action
    await createAuditLog({
      userId: user.id,
      action: decision === 'approved' ? AuditActions.TRADE_APPROVED : AuditActions.TRADE_REJECTED,
      entityType: 'TradeApproval',
      entityId: approval.id,
      newValues: { tradeRequestId: tradeId, decision, comments },
    });

    return NextResponse.json({
      success: true,
      approval,
      message: `Trade ${decision}`,
    });
  } catch (error) {
    console.error('Trade approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process trade approval' },
      { status: 500 }
    );
  }
}
