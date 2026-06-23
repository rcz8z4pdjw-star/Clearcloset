import { NextRequest, NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { createAuditLog, AuditActions } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      // Log the logout
      await createAuditLog({
        userId: session.user.id,
        action: AuditActions.USER_LOGOUT,
        entityType: 'User',
        entityId: session.user.id,
      });
    }

    // Clear the session cookie
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('ascent_session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
