import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's referral data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a full implementation, fetch from database
    // For now, simulate referral data
    const referralCode = `${user.firstName?.toUpperCase().slice(0, 4) || 'USER'}${new Date().getFullYear()}`;

    const referrals = [
      {
        id: 'r1',
        referredUser: {
          id: 'user-1',
          name: 'Jamie Smith',
          avatar: null,
        },
        status: 'ACTIVE', // PENDING, ACTIVE, EXPIRED
        joinedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        xpEarned: 150,
      },
      {
        id: 'r2',
        referredUser: {
          id: 'user-2',
          name: 'Morgan Lee',
          avatar: null,
        },
        status: 'ACTIVE',
        joinedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        xpEarned: 150,
      },
      {
        id: 'r3',
        referredUser: {
          id: 'user-3',
          name: 'Casey Brown',
          avatar: null,
        },
        status: 'PENDING',
        joinedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        xpEarned: 0,
      },
    ];

    const totalReferrals = referrals.filter(r => r.status === 'ACTIVE').length;
    const pendingReferrals = referrals.filter(r => r.status === 'PENDING').length;
    const totalXpEarned = referrals.reduce((sum, r) => sum + r.xpEarned, 0);

    // Calculate tier based on total referrals
    const tiers = [
      { name: 'Bronze', min: 0, max: 2, xpPerReferral: 100 },
      { name: 'Silver', min: 3, max: 7, xpPerReferral: 150 },
      { name: 'Gold', min: 8, max: 14, xpPerReferral: 200 },
      { name: 'Platinum', min: 15, max: Infinity, xpPerReferral: 250 },
    ];

    const currentTier = tiers.find(t => totalReferrals >= t.min && totalReferrals <= t.max);
    const nextTier = tiers.find(t => t.min > totalReferrals);

    // Milestones
    const milestones = [
      { count: 1, reward: '100 XP Bonus', reached: totalReferrals >= 1 },
      { count: 3, reward: 'Referral Champion Badge', reached: totalReferrals >= 3 },
      { count: 5, reward: '2x XP Boost (24h)', reached: totalReferrals >= 5 },
      { count: 10, reward: 'Exclusive Avatar Frame', reached: totalReferrals >= 10 },
      { count: 15, reward: 'VIP Badge', reached: totalReferrals >= 15 },
    ];

    return NextResponse.json({
      referralCode,
      referralLink: `https://ascent.app/join?ref=${referralCode}`,
      stats: {
        totalReferrals,
        pendingReferrals,
        totalXpEarned,
        currentTier: currentTier?.name || 'Bronze',
        nextTier: nextTier?.name || null,
        referralsToNextTier: nextTier ? nextTier.min - totalReferrals : 0,
        xpPerReferral: currentTier?.xpPerReferral || 100,
      },
      referrals,
      milestones,
      tiers,
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}

// Send a referral invite
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, method } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In a full implementation:
    // 1. Check if email is already registered
    // 2. Check if invite was already sent recently
    // 3. Create invite record
    // 4. Send email invitation

    const invite = {
      id: `invite_${Date.now()}`,
      email,
      sentAt: new Date().toISOString(),
      status: 'SENT',
      method: method || 'email',
    };

    return NextResponse.json({
      success: true,
      invite,
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    console.error('Send invite error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

// Validate a referral code (used during signup)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // In a full implementation:
    // 1. Check if referral code exists and is valid
    // 2. Get referrer's information
    // 3. Check if referrer has reached any limits

    // Simulate validation
    const isValid = referralCode.length >= 4;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrer: {
        id: 'referrer-123',
        firstName: referralCode.slice(0, 4),
      },
      bonusXp: 100, // Bonus XP for using a referral code
    });
  } catch (error) {
    console.error('Validate referral error:', error);
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
