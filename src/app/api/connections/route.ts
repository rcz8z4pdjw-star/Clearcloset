import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's connections
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'pending', 'all'

    // Get active connections
    const connections = await prisma.familyConnection.findMany({
      where: {
        userId: user.id,
        status: status === 'pending' ? 'PENDING' : 'ACTIVE',
      },
    });

    // Get connected user details
    const connectedUserIds = connections.map((c) => c.connectedUserId);
    const connectedUsers = await prisma.user.findMany({
      where: { id: { in: connectedUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        level: true,
        xp: true,
        streak: true,
        status: true,
        lastActivityAt: true,
      },
    });

    // Combine connection data with user details
    const enrichedConnections = connections.map((conn) => {
      const connectedUser = connectedUsers.find((u) => u.id === conn.connectedUserId);
      return {
        id: conn.id,
        relationship: conn.relationship,
        status: conn.status,
        connectedAt: conn.createdAt,
        user: connectedUser
          ? {
              id: connectedUser.id,
              name: `${connectedUser.firstName} ${connectedUser.lastName}`,
              avatar: connectedUser.avatarUrl,
              level: connectedUser.level,
              xp: connectedUser.xp,
              streak: connectedUser.streak,
              isOnline: connectedUser.status === 'ACTIVE',
              lastActive: connectedUser.lastActivityAt,
            }
          : null,
      };
    });

    // Get pending connection requests (incoming)
    const pendingIncoming = await prisma.familyConnection.findMany({
      where: {
        connectedUserId: user.id,
        status: 'PENDING',
      },
    });

    const pendingUserIds = pendingIncoming.map((p) => p.userId);
    const pendingUsers = await prisma.user.findMany({
      where: { id: { in: pendingUserIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        level: true,
      },
    });

    const pendingRequests = pendingIncoming.map((conn) => {
      const requestUser = pendingUsers.find((u) => u.id === conn.userId);
      return {
        id: conn.id,
        type: 'incoming',
        relationship: conn.relationship,
        requestedAt: conn.createdAt,
        user: requestUser
          ? {
              id: requestUser.id,
              name: `${requestUser.firstName} ${requestUser.lastName}`,
              avatar: requestUser.avatarUrl,
              level: requestUser.level,
            }
          : null,
      };
    });

    // Stats
    const stats = {
      totalConnections: enrichedConnections.filter((c) => c.status === 'ACTIVE').length,
      pendingRequests: pendingRequests.length,
      onlineNow: enrichedConnections.filter((c) => c.user?.isOnline).length,
    };

    return NextResponse.json({
      connections: enrichedConnections,
      pendingRequests,
      stats,
    });
  } catch (error) {
    console.error('Get connections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

// Send a connection request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, relationship } = body;

    if (!targetUserId || !relationship) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, relationship' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const existing = await prisma.familyConnection.findFirst({
      where: {
        OR: [
          { userId: user.id, connectedUserId: targetUserId },
          { userId: targetUserId, connectedUserId: user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Connection already exists or pending' },
        { status: 400 }
      );
    }

    // Create connection request
    const connection = await prisma.familyConnection.create({
      data: {
        userId: user.id,
        connectedUserId: targetUserId,
        relationship,
        status: 'PENDING',
      },
    });

    // Notify the target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'CONNECTION_REQUEST',
        title: 'New Connection Request',
        message: `${user.firstName} ${user.lastName} wants to connect with you as ${relationship}`,
      },
    });

    return NextResponse.json({
      success: true,
      connection,
    });
  } catch (error) {
    console.error('Create connection error:', error);
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    );
  }
}

// Accept or reject a connection request
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, action } = body;

    if (!connectionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: connectionId, action' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Find the connection request
    const connection = await prisma.familyConnection.findFirst({
      where: {
        id: connectionId,
        connectedUserId: user.id, // User must be the recipient
        status: 'PENDING',
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      );
    }

    if (action === 'reject') {
      await prisma.familyConnection.delete({
        where: { id: connectionId },
      });

      return NextResponse.json({
        success: true,
        message: 'Connection request rejected',
      });
    }

    // Accept the connection
    const updatedConnection = await prisma.familyConnection.update({
      where: { id: connectionId },
      data: { status: 'ACTIVE' },
    });

    // Create reciprocal connection
    await prisma.familyConnection.create({
      data: {
        userId: user.id,
        connectedUserId: connection.userId,
        relationship: getReciprocalRelationship(connection.relationship),
        status: 'ACTIVE',
      },
    });

    // Notify the original requester
    await prisma.notification.create({
      data: {
        userId: connection.userId,
        type: 'CONNECTION_ACCEPTED',
        title: 'Connection Accepted!',
        message: `${user.firstName} ${user.lastName} accepted your connection request`,
      },
    });

    // Award XP for making connections
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: 25 } },
    });

    await prisma.user.update({
      where: { id: connection.userId },
      data: { xp: { increment: 25 } },
    });

    return NextResponse.json({
      success: true,
      connection: updatedConnection,
      xpEarned: 25,
    });
  } catch (error) {
    console.error('Update connection error:', error);
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    );
  }
}

// Remove a connection
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('id');

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    // Find and verify the connection
    const connection = await prisma.familyConnection.findFirst({
      where: {
        id: connectionId,
        userId: user.id,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Delete both directions of the connection
    await prisma.familyConnection.deleteMany({
      where: {
        OR: [
          { userId: user.id, connectedUserId: connection.connectedUserId },
          { userId: connection.connectedUserId, connectedUserId: user.id },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete connection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    );
  }
}

function getReciprocalRelationship(relationship: string): string {
  const reciprocals: Record<string, string> = {
    parent: 'child',
    child: 'parent',
    sibling: 'sibling',
    cousin: 'cousin',
    mentor: 'mentee',
    mentee: 'mentor',
    friend: 'friend',
  };
  return reciprocals[relationship] || 'friend';
}
