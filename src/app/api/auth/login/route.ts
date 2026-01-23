import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createDevSession, setSessionCookie, hashPassword, verifyPassword } from '@/lib/auth';
import { createAuditLog, AuditActions } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // For dev auth, we check against a stored password or allow demo passwords
    // In production, this would use Auth0
    const isDevMode = process.env.USE_DEV_AUTH === 'true';

    if (isDevMode) {
      // Allow demo password for seeded users
      const isDemoPassword = password === 'demo123';

      if (!isDemoPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createDevSession(user.id);

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    });

    // Log the login
    await createAuditLog({
      userId: user.id,
      action: AuditActions.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((r) => r.role),
      },
    });

    // Set the session cookie
    response.cookies.set('ascent_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 40 * 60, // 40 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
