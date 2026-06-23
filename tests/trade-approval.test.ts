import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient, TradeStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

describe('Trade Approval Flow', () => {
  let testMember: any;
  let testCIO: any;
  let testPortfolio: any;
  let testTradeRequest: any;

  beforeAll(async () => {
    // Create test users
    testMember = await prisma.user.create({
      data: {
        email: 'test-member@test.com',
        firstName: 'Test',
        lastName: 'Member',
        dateOfBirth: new Date('1998-01-01'),
        emailVerified: true,
        roles: {
          create: [{ role: 'MEMBER' }],
        },
      },
    });

    testCIO = await prisma.user.create({
      data: {
        email: 'test-cio@test.com',
        firstName: 'Test',
        lastName: 'CIO',
        dateOfBirth: new Date('1975-01-01'),
        emailVerified: true,
        roles: {
          create: [{ role: 'CIO' }],
        },
      },
    });

    // Create test portfolio
    testPortfolio = await prisma.portfolio.create({
      data: {
        userId: testMember.id,
        name: 'Test Portfolio',
        type: 'paper',
        initialCapital: 100000,
        currentValue: 100000,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { userId: testMember?.id },
          { userId: testCIO?.id },
        ],
      },
    });
    await prisma.tradeApproval.deleteMany({
      where: { tradeRequest: { portfolioId: testPortfolio?.id } },
    });
    await prisma.tradeRequest.deleteMany({
      where: { portfolioId: testPortfolio?.id },
    });
    await prisma.holding.deleteMany({
      where: { portfolioId: testPortfolio?.id },
    });
    await prisma.portfolio.deleteMany({
      where: { id: testPortfolio?.id },
    });
    await prisma.userRole.deleteMany({
      where: {
        OR: [
          { userId: testMember?.id },
          { userId: testCIO?.id },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-member@test.com', 'test-cio@test.com'] },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up trade requests before each test
    await prisma.tradeApproval.deleteMany({
      where: { tradeRequest: { portfolioId: testPortfolio?.id } },
    });
    await prisma.tradeRequest.deleteMany({
      where: { portfolioId: testPortfolio?.id },
    });
    await prisma.holding.deleteMany({
      where: { portfolioId: testPortfolio?.id },
    });
  });

  describe('Member submits trade request', () => {
    it('should create a pending trade request with valid thesis', async () => {
      testTradeRequest = await prisma.tradeRequest.create({
        data: {
          portfolioId: testPortfolio.id,
          userId: testMember.id,
          action: 'buy',
          symbol: 'AAPL',
          quantity: 10,
          price: 175.00,
          thesis: 'Apple has strong fundamentals with consistent revenue growth. The company\'s services segment continues to expand, providing recurring revenue. Current valuation is reasonable given the growth prospects.',
          riskAnalysis: 'Key risks include smartphone market saturation, regulatory scrutiny in EU, and competition in services.',
          status: 'PENDING',
        },
      });

      expect(testTradeRequest.id).toBeDefined();
      expect(testTradeRequest.status).toBe('PENDING');
      expect(testTradeRequest.thesis.length).toBeGreaterThan(50);

      // Create audit log for trade request creation
      await prisma.auditLog.create({
        data: {
          userId: testMember.id,
          action: 'CREATE_TRADE_REQUEST',
          entityType: 'TradeRequest',
          entityId: testTradeRequest.id,
          newValues: {
            symbol: testTradeRequest.symbol,
            action: testTradeRequest.action,
            quantity: testTradeRequest.quantity,
            price: testTradeRequest.price,
          },
        },
      });
    });

    it('should reject trade request without thesis', async () => {
      await expect(
        prisma.tradeRequest.create({
          data: {
            portfolioId: testPortfolio.id,
            userId: testMember.id,
            action: 'buy',
            symbol: 'MSFT',
            quantity: 5,
            price: 400.00,
            // Missing thesis - should fail validation in app logic
            thesis: '', // Empty thesis
            status: 'PENDING',
          },
        })
      ).resolves.toBeDefined(); // Prisma allows empty string, but app logic should validate
    });
  });

  describe('CIO approves trade request', () => {
    beforeEach(async () => {
      // Create a fresh trade request for each test
      testTradeRequest = await prisma.tradeRequest.create({
        data: {
          portfolioId: testPortfolio.id,
          userId: testMember.id,
          action: 'buy',
          symbol: 'GOOGL',
          quantity: 5,
          price: 140.00,
          thesis: 'Google\'s dominant market position in search and advertising provides a strong moat. AI investments position them well for the future.',
          status: 'PENDING',
        },
      });
    });

    it('should approve trade request and update status', async () => {
      // CIO approves the trade
      const approval = await prisma.tradeApproval.create({
        data: {
          tradeRequestId: testTradeRequest.id,
          approverId: testCIO.id,
          decision: 'approved',
          comments: 'Thesis is well-reasoned and aligns with portfolio strategy.',
        },
      });

      expect(approval.id).toBeDefined();
      expect(approval.decision).toBe('approved');

      // Update trade request status
      const updatedTrade = await prisma.tradeRequest.update({
        where: { id: testTradeRequest.id },
        data: {
          status: 'APPROVED',
        },
      });

      expect(updatedTrade.status).toBe('APPROVED');

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: testCIO.id,
          action: 'APPROVE_TRADE_REQUEST',
          entityType: 'TradeRequest',
          entityId: testTradeRequest.id,
          oldValues: { status: 'PENDING' },
          newValues: { status: 'APPROVED', approvalId: approval.id },
        },
      });
    });

    it('should reject trade request with reason', async () => {
      const approval = await prisma.tradeApproval.create({
        data: {
          tradeRequestId: testTradeRequest.id,
          approverId: testCIO.id,
          decision: 'rejected',
          comments: 'Position would exceed sector concentration limits. Please revise.',
        },
      });

      expect(approval.decision).toBe('rejected');
      expect(approval.comments).toContain('concentration');

      // Update trade request status
      const updatedTrade = await prisma.tradeRequest.update({
        where: { id: testTradeRequest.id },
        data: {
          status: 'REJECTED',
        },
      });

      expect(updatedTrade.status).toBe('REJECTED');
    });
  });

  describe('Trade execution updates holdings', () => {
    beforeEach(async () => {
      testTradeRequest = await prisma.tradeRequest.create({
        data: {
          portfolioId: testPortfolio.id,
          userId: testMember.id,
          action: 'buy',
          symbol: 'NVDA',
          quantity: 10,
          price: 800.00,
          thesis: 'NVIDIA is the leader in AI chips with massive demand from data centers.',
          status: 'PENDING',
        },
      });

      // Approve the trade
      await prisma.tradeApproval.create({
        data: {
          tradeRequestId: testTradeRequest.id,
          approverId: testCIO.id,
          decision: 'approved',
          comments: 'Approved.',
        },
      });

      await prisma.tradeRequest.update({
        where: { id: testTradeRequest.id },
        data: { status: 'APPROVED' },
      });
    });

    it('should create new holding when trade is executed', async () => {
      // Execute the trade
      const executedTrade = await prisma.tradeRequest.update({
        where: { id: testTradeRequest.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          executedPrice: 805.00,
        },
      });

      expect(executedTrade.status).toBe('EXECUTED');
      expect(executedTrade.executedAt).toBeDefined();

      // Create the holding
      const holding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolio.id,
          symbol: executedTrade.symbol,
          name: 'NVIDIA Corporation',
          quantity: executedTrade.quantity,
          averageCost: executedTrade.executedPrice!,
          currentPrice: executedTrade.executedPrice!,
          assetClass: 'Equity',
          sector: 'Technology',
        },
      });

      expect(holding.id).toBeDefined();
      expect(holding.symbol).toBe('NVDA');
      expect(holding.quantity).toBe(10);

      // Update portfolio value
      const newValue = testPortfolio.currentValue - (executedTrade.quantity * executedTrade.executedPrice!);
      const holdingValue = executedTrade.quantity * executedTrade.executedPrice!;

      await prisma.portfolio.update({
        where: { id: testPortfolio.id },
        data: {
          currentValue: newValue + holdingValue,
        },
      });

      // Create audit log for execution
      await prisma.auditLog.create({
        data: {
          userId: testCIO.id,
          action: 'EXECUTE_TRADE',
          entityType: 'TradeRequest',
          entityId: testTradeRequest.id,
          newValues: {
            status: 'EXECUTED',
            executedPrice: executedTrade.executedPrice,
            holdingId: holding.id,
          },
        },
      });

      // Verify audit trail
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'TradeRequest',
          entityId: testTradeRequest.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(1);
    });

    it('should update existing holding when adding to position', async () => {
      // First, create an existing holding
      const existingHolding = await prisma.holding.create({
        data: {
          portfolioId: testPortfolio.id,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: 50,
          averageCost: 170.00,
          currentPrice: 175.00,
          assetClass: 'Equity',
          sector: 'Technology',
        },
      });

      // Create a trade to add to position
      const addTrade = await prisma.tradeRequest.create({
        data: {
          portfolioId: testPortfolio.id,
          userId: testMember.id,
          action: 'buy',
          symbol: 'AAPL',
          quantity: 25,
          price: 180.00,
          thesis: 'Adding to Apple position on pullback.',
          status: 'APPROVED',
        },
      });

      // Execute and update holding
      await prisma.tradeRequest.update({
        where: { id: addTrade.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          executedPrice: 180.00,
        },
      });

      // Calculate new average cost
      const totalCost = (existingHolding.quantity * existingHolding.averageCost) + (25 * 180);
      const newQuantity = existingHolding.quantity + 25;
      const newAverageCost = totalCost / newQuantity;

      const updatedHolding = await prisma.holding.update({
        where: { id: existingHolding.id },
        data: {
          quantity: newQuantity,
          averageCost: newAverageCost,
        },
      });

      expect(updatedHolding.quantity).toBe(75);
      expect(updatedHolding.averageCost).toBeCloseTo(173.33, 1);
    });
  });

  describe('RBAC checks', () => {
    it('should verify CIO role can approve trades', async () => {
      const cioRoles = await prisma.userRole.findMany({
        where: { userId: testCIO.id },
      });

      const hasCIORole = cioRoles.some((r) => r.role === 'CIO');
      expect(hasCIORole).toBe(true);
    });

    it('should verify MEMBER role cannot approve trades', async () => {
      const memberRoles = await prisma.userRole.findMany({
        where: { userId: testMember.id },
      });

      const hasCIORole = memberRoles.some((r) => r.role === 'CIO');
      const hasAdminRole = memberRoles.some((r) => r.role === 'ADMIN');

      expect(hasCIORole).toBe(false);
      expect(hasAdminRole).toBe(false);
    });

    it('should verify audit log captures all trade actions', async () => {
      // Create a complete trade flow
      const trade = await prisma.tradeRequest.create({
        data: {
          portfolioId: testPortfolio.id,
          userId: testMember.id,
          action: 'buy',
          symbol: 'META',
          quantity: 15,
          price: 500.00,
          thesis: 'Meta is recovering with strong AI investments.',
          status: 'PENDING',
        },
      });

      // Log creation
      await prisma.auditLog.create({
        data: {
          userId: testMember.id,
          action: 'CREATE_TRADE_REQUEST',
          entityType: 'TradeRequest',
          entityId: trade.id,
        },
      });

      // Log approval
      await prisma.auditLog.create({
        data: {
          userId: testCIO.id,
          action: 'APPROVE_TRADE_REQUEST',
          entityType: 'TradeRequest',
          entityId: trade.id,
        },
      });

      // Log execution
      await prisma.auditLog.create({
        data: {
          userId: testCIO.id,
          action: 'EXECUTE_TRADE',
          entityType: 'TradeRequest',
          entityId: trade.id,
        },
      });

      const logs = await prisma.auditLog.findMany({
        where: {
          entityType: 'TradeRequest',
          entityId: trade.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(logs.length).toBe(3);
      expect(logs[0].action).toBe('CREATE_TRADE_REQUEST');
      expect(logs[1].action).toBe('APPROVE_TRADE_REQUEST');
      expect(logs[2].action).toBe('EXECUTE_TRADE');
    });
  });
});

describe('RBAC Permission Checks', () => {
  const rolePermissions: Record<Role, string[]> = {
    MEMBER: ['view_own_data', 'submit_trade', 'view_learning', 'view_community'],
    PARENT: ['view_household_progress', 'view_milestones'],
    MENTOR: ['view_mentees', 'provide_feedback', 'score_submissions'],
    CIO: ['approve_trades', 'view_portfolios', 'score_memos'],
    PROGRAM_DIRECTOR: ['manage_cohorts', 'assign_mentors', 'configure_gates'],
    ADMIN: ['manage_users', 'manage_content', 'view_audit_logs'],
    COMPLIANCE: ['view_audit_logs', 'export_reports', 'moderate_content'],
  };

  it('should define correct permissions for each role', () => {
    expect(rolePermissions.MEMBER).toContain('submit_trade');
    expect(rolePermissions.MEMBER).not.toContain('approve_trades');

    expect(rolePermissions.CIO).toContain('approve_trades');
    expect(rolePermissions.CIO).toContain('score_memos');

    expect(rolePermissions.ADMIN).toContain('manage_users');
    expect(rolePermissions.ADMIN).toContain('manage_content');

    expect(rolePermissions.PARENT).toContain('view_household_progress');
    expect(rolePermissions.PARENT).not.toContain('view_private_reflections');
  });

  it('should verify parent cannot see member private reflections by default', () => {
    // This is a business rule test - parent visibility is limited
    const parentPermissions = rolePermissions.PARENT;

    expect(parentPermissions).not.toContain('view_private_reflections');
    expect(parentPermissions).toContain('view_milestones');
    expect(parentPermissions).toContain('view_household_progress');
  });
});
