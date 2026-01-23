import { prisma } from './db';
import { headers } from 'next/headers';

export interface AuditLogEntry {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      metadata: entry.metadata,
      ipAddress,
      userAgent,
    },
  });
}

// Common audit actions
export const AuditActions = {
  // User actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_ROLE_ASSIGNED: 'user.role_assigned',
  USER_ROLE_REMOVED: 'user.role_removed',

  // Invite actions
  INVITE_SENT: 'invite.sent',
  INVITE_ACCEPTED: 'invite.accepted',
  INVITE_REVOKED: 'invite.revoked',

  // Content actions
  CONTENT_CREATED: 'content.created',
  CONTENT_UPDATED: 'content.updated',
  CONTENT_STATUS_CHANGED: 'content.status_changed',
  CONTENT_PUBLISHED: 'content.published',

  // Learning actions
  QUIZ_COMPLETED: 'quiz.completed',
  LESSON_COMPLETED: 'lesson.completed',
  SUBMISSION_CREATED: 'submission.created',
  BADGE_AWARDED: 'badge.awarded',
  CERTIFICATE_ISSUED: 'certificate.issued',

  // Mentorship actions
  MENTOR_ASSIGNED: 'mentor.assigned',
  SESSION_SCHEDULED: 'session.scheduled',
  SESSION_COMPLETED: 'session.completed',
  ACTION_PLAN_CREATED: 'action_plan.created',
  ACTION_PLAN_COMPLETED: 'action_plan.completed',

  // Portfolio actions
  PORTFOLIO_CREATED: 'portfolio.created',
  TRADE_REQUESTED: 'trade.requested',
  TRADE_APPROVED: 'trade.approved',
  TRADE_REJECTED: 'trade.rejected',
  TRADE_EXECUTED: 'trade.executed',
  HOLDING_UPDATED: 'holding.updated',

  // Philanthropy actions
  GIVING_STRATEGY_CREATED: 'giving_strategy.created',
  GRANT_SUBMITTED: 'grant.submitted',
  GRANT_VOTED: 'grant.voted',
  GRANT_FUNDED: 'grant.funded',

  // Moderation actions
  POST_FLAGGED: 'post.flagged',
  POST_MODERATED: 'post.moderated',
  COMMENT_FLAGGED: 'comment.flagged',
  COMMENT_MODERATED: 'comment.moderated',

  // Export actions
  EXPORT_REQUESTED: 'export.requested',
  EXPORT_COMPLETED: 'export.completed',
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

// Helper to log with current user
export async function logAction(
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId?: string,
  details?: {
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    ...details,
  });
}
