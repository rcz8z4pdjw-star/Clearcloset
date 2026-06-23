import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = [
        {
          id: 'm1',
          senderId: 'other',
          senderName: 'Alex Johnson',
          text: 'Hey! Did you see the new challenges?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'read',
        },
        {
          id: 'm2',
          senderId: user.id,
          senderName: 'You',
          text: 'Yes! I already completed two daily challenges 💪',
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          status: 'read',
        },
        {
          id: 'm3',
          senderId: 'other',
          senderName: 'Alex Johnson',
          text: 'Nice! Want to do the family challenge together?',
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          status: 'read',
        },
      ];

      return NextResponse.json({
        conversationId,
        messages,
        hasMore: false,
      });
    }

    // Get all conversations
    const conversations = [
      {
        id: 'c1',
        type: 'direct',
        participant: {
          id: 'user-123',
          name: 'Alex Johnson',
          avatar: null,
          isOnline: true,
        },
        lastMessage: {
          text: 'Great job on completing the quiz! 🎉',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          senderId: 'user-123',
        },
        unreadCount: 2,
        isPinned: true,
      },
      {
        id: 'c2',
        type: 'direct',
        participant: {
          id: 'mentor-456',
          name: 'Sarah Williams (Mentor)',
          avatar: null,
          isOnline: true,
        },
        lastMessage: {
          text: 'Let me know if you need help with the investing module.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          senderId: 'mentor-456',
        },
        unreadCount: 0,
        isPinned: true,
      },
      {
        id: 'c3',
        type: 'group',
        name: 'Teen Investing Club',
        memberCount: 24,
        lastMessage: {
          text: 'Taylor: Has anyone tried the stock simulator?',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          senderId: 'user-789',
        },
        unreadCount: 5,
        isPinned: false,
      },
    ];

    const stats = {
      totalConversations: conversations.length,
      unreadMessages: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
      onlineContacts: conversations.filter(c => c.type === 'direct' && c.participant?.isOnline).length,
    };

    return NextResponse.json({
      conversations,
      stats,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Send a message
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, recipientId, text, attachments } = body;

    if (!text || (!conversationId && !recipientId)) {
      return NextResponse.json(
        { error: 'Missing required fields: text and (conversationId or recipientId)' },
        { status: 400 }
      );
    }

    // Create the message
    const message = {
      id: `msg_${Date.now()}`,
      conversationId: conversationId || `conv_${Date.now()}`,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      text,
      attachments: attachments || [],
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    // In a full implementation:
    // 1. Save message to database
    // 2. Update conversation's lastMessage
    // 3. Send real-time notification to recipient
    // 4. Create notification record

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// Update conversation (pin, mute, archive)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, action } = body;

    if (!conversationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, action' },
        { status: 400 }
      );
    }

    const validActions = ['pin', 'unpin', 'mute', 'unmute', 'archive', 'markRead'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // In a full implementation, update the conversation in database

    return NextResponse.json({
      success: true,
      action,
      conversationId,
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // In a full implementation, delete or archive the conversation

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
