import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        linkedinUrl: true,
        twitterHandle: true,
        dateOfBirth: true,
        ageBandOverride: true,
        createdAt: true,
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, bio, linkedinUrl, twitterHandle } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Validate bio length
    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        linkedinUrl: true,
        twitterHandle: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        bio: bio || null,
        linkedinUrl: linkedinUrl || null,
        twitterHandle: twitterHandle || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        linkedinUrl: true,
        twitterHandle: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_PROFILE',
      entityType: 'User',
      entityId: user.id,
      oldValues: currentUser,
      newValues: updatedUser,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
