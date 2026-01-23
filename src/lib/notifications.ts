import { prisma } from './db';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await prisma.notification.create({
    data: input,
  });
}

export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      ...notification,
    })),
  });
}

export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

export async function getAllNotifications(userId: string, limit: number = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

// Notification helpers for common events
export async function notifySessionScheduled(
  userId: string,
  mentorName: string,
  sessionDate: Date
): Promise<void> {
  await createNotification({
    userId,
    type: 'SESSION',
    title: 'Session Scheduled',
    message: `Your mentorship session with ${mentorName} has been scheduled for ${sessionDate.toLocaleDateString()}.`,
    link: '/dashboard/mentorship',
  });
}

export async function notifyTradeApproved(
  userId: string,
  symbol: string,
  action: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'APPROVAL',
    title: 'Trade Approved',
    message: `Your ${action} request for ${symbol} has been approved and executed.`,
    link: '/dashboard/practicum/portfolio',
  });
}

export async function notifyTradeRejected(
  userId: string,
  symbol: string,
  action: string,
  reason?: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'APPROVAL',
    title: 'Trade Rejected',
    message: `Your ${action} request for ${symbol} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
    link: '/dashboard/practicum/portfolio',
  });
}

export async function notifyBadgeAwarded(
  userId: string,
  badgeName: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'MILESTONE',
    title: 'Badge Earned!',
    message: `Congratulations! You've earned the "${badgeName}" badge.`,
    link: '/dashboard/progress',
  });
}

export async function notifyFeedbackReceived(
  userId: string,
  feedbackType: string,
  feedbackSource: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'FEEDBACK',
    title: 'New Feedback',
    message: `You've received feedback on your ${feedbackType} from ${feedbackSource}.`,
    link: '/dashboard/feedback',
  });
}

export async function notifyInviteAccepted(
  senderId: string,
  acceptedByName: string
): Promise<void> {
  await createNotification({
    userId: senderId,
    type: 'INVITE',
    title: 'Invite Accepted',
    message: `${acceptedByName} has accepted your invitation to join the platform.`,
    link: '/admin/users',
  });
}

export async function notifyActionPlanDue(
  userId: string,
  planTitle: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'REMINDER',
    title: 'Action Plan Due Soon',
    message: `Your action plan "${planTitle}" is due soon. Don't forget to complete it!`,
    link: '/dashboard/mentorship/action-plans',
  });
}
