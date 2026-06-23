import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's study groups or discover groups
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'my-groups', 'discover', 'all'
    const category = searchParams.get('category');

    // In a real implementation, we'd have StudyGroup and StudyGroupMember models
    // For now, return simulated data structure

    // Simulated groups the user is part of
    const myGroups = [
      {
        id: 'g1',
        name: 'Teen Investing Club',
        description: 'Learn about investing together with fellow teens',
        memberCount: 24,
        maxMembers: 30,
        category: 'investing',
        ageBand: 'TEEN_SKILLS',
        isOwner: false,
        isModerator: true,
        createdAt: '2024-01-15',
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        weeklyGoal: { target: 5, current: 3 },
      },
      {
        id: 'g2',
        name: 'Budget Beginners',
        description: 'Master budgeting basics with peers your age',
        memberCount: 18,
        maxMembers: 25,
        category: 'budgeting',
        ageBand: 'TEEN_SKILLS',
        isOwner: true,
        isModerator: true,
        createdAt: '2024-02-01',
        lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        weeklyGoal: { target: 3, current: 3 },
      },
    ];

    // Groups available to discover
    const discoverGroups = [
      {
        id: 'dg1',
        name: 'Saving Superstars',
        description: 'A group focused on developing saving habits',
        memberCount: 32,
        maxMembers: 40,
        category: 'saving',
        ageBand: 'TEEN_SKILLS',
        topics: ['emergency-fund', 'savings-goals', 'compound-interest'],
      },
      {
        id: 'dg2',
        name: 'Future Entrepreneurs',
        description: 'Learn entrepreneurship and business basics',
        memberCount: 15,
        maxMembers: 20,
        category: 'entrepreneurship',
        ageBand: 'TEEN_SKILLS',
        topics: ['business-planning', 'marketing', 'side-hustles'],
      },
    ];

    let groups;
    if (type === 'discover') {
      groups = discoverGroups;
    } else if (type === 'my-groups') {
      groups = myGroups;
    } else {
      groups = { myGroups, discoverGroups };
    }

    // Filter by category if provided
    if (category && Array.isArray(groups)) {
      groups = groups.filter((g: any) => g.category === category);
    }

    return NextResponse.json({
      groups,
      stats: {
        myGroupsCount: myGroups.length,
        totalMembers: myGroups.reduce((sum, g) => sum + g.memberCount, 0),
        goalsCompleted: myGroups.filter(g => g.weeklyGoal.current >= g.weeklyGoal.target).length,
      },
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
}

// Create a new study group
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, maxMembers } = body;

    if (!name || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, category' },
        { status: 400 }
      );
    }

    // In a real implementation, create the group in database
    const newGroup = {
      id: `group_${Date.now()}`,
      name,
      description,
      category,
      maxMembers: maxMembers || 25,
      memberCount: 1,
      isOwner: true,
      isModerator: true,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    // Award XP for creating a group
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: 50 } },
    });

    return NextResponse.json({
      success: true,
      group: newGroup,
      xpEarned: 50,
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}

// Join a study group
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, action } = body;

    if (!groupId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: groupId, action' },
        { status: 400 }
      );
    }

    if (!['join', 'leave'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "join" or "leave"' },
        { status: 400 }
      );
    }

    // In a real implementation:
    // 1. Check if group exists and has space
    // 2. Add/remove user from group members
    // 3. Update member count

    if (action === 'join') {
      // Award XP for joining a group
      await prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: 15 } },
      });

      return NextResponse.json({
        success: true,
        message: 'Successfully joined the group',
        xpEarned: 15,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group',
    });
  } catch (error) {
    console.error('Update group membership error:', error);
    return NextResponse.json(
      { error: 'Failed to update group membership' },
      { status: 500 }
    );
  }
}

// Delete a study group (owner only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('id');

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation:
    // 1. Verify user is the owner
    // 2. Delete group and all memberships
    // 3. Notify members

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
}
