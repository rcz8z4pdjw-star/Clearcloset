import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(
  process.env.DEV_AUTH_SECRET || 'dev-secret-change-in-production'
);

const SESSION_COOKIE_NAME = 'ascent_session';
const SESSION_TIMEOUT_MINUTES = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '40');

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  householdIds: string[];
  ageBand: string | null;
  avatarUrl: string | null;
}

export interface Session {
  user: SessionUser;
  expiresAt: Date;
}

// Dev Auth Functions (for local development without Auth0)
export async function createDevSession(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      householdMemberships: true,
    },
  });

  if (!user) throw new Error('User not found');

  const expiresAt = new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((r) => r.role),
    householdIds: user.householdMemberships.map((h) => h.householdId),
    ageBand: user.ageBandOverride,
    avatarUrl: user.avatarUrl,
    expiresAt: expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const expiresAt = new Date(payload.expiresAt as string);
    if (expiresAt < new Date()) {
      return null;
    }

    return {
      user: {
        id: payload.userId as string,
        email: payload.email as string,
        firstName: payload.firstName as string,
        lastName: payload.lastName as string,
        roles: payload.roles as Role[],
        householdIds: payload.householdIds as string[],
        ageBand: payload.ageBand as string | null,
        avatarUrl: payload.avatarUrl as string | null,
      },
      expiresAt,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  return verifySession(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();

  const hasRole = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    redirect('/unauthorized');
  }

  return user;
}

export async function requireAnyRole(...roles: Role[]): Promise<SessionUser> {
  return requireRole(roles);
}

export function hasRole(user: SessionUser | null, role: Role): boolean {
  return user?.roles.includes(role) ?? false;
}

export function hasAnyRole(user: SessionUser | null, roles: Role[]): boolean {
  return user?.roles.some((r) => roles.includes(r)) ?? false;
}

export function isAdmin(user: SessionUser | null): boolean {
  return hasAnyRole(user, ['ADMIN', 'COMPLIANCE']);
}

export function isMentor(user: SessionUser | null): boolean {
  return hasRole(user, 'MENTOR');
}

export function isCIO(user: SessionUser | null): boolean {
  return hasRole(user, 'CIO');
}

export function isProgramDirector(user: SessionUser | null): boolean {
  return hasRole(user, 'PROGRAM_DIRECTOR');
}

export function isParent(user: SessionUser | null): boolean {
  return hasRole(user, 'PARENT');
}

export function isMember(user: SessionUser | null): boolean {
  return hasRole(user, 'MEMBER');
}

// Password hashing for dev auth
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Check if user can access household data
export function canAccessHousehold(user: SessionUser | null, householdId: string): boolean {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return user.householdIds.includes(householdId);
}

// Check parent visibility rules
export function canViewMemberDetails(viewer: SessionUser | null, memberId: string): boolean {
  if (!viewer) return false;
  if (viewer.id === memberId) return true;
  if (isAdmin(viewer) || isMentor(viewer) || isProgramDirector(viewer)) return true;
  // Parents can see their household members but with restricted data
  return false;
}

// Session cookie management
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TIMEOUT_MINUTES * 60,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Refresh session on activity
export async function refreshSession(): Promise<void> {
  const session = await getSession();
  if (session) {
    const newToken = await createDevSession(session.user.id);
    await setSessionCookie(newToken);
  }
}
