export type UserKind = 'permanent' | 'temporary';
export type PlatformRole = 'owner' | 'admin' | 'operator' | 'viewer';
export type UserStatus = 'pending' | 'active' | 'disabled' | 'expired';
export type SessionScope = 'setup' | 'user';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  kind: UserKind;
  platformRole: PlatformRole;
  status: UserStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  kind: UserKind;
  platformRole: PlatformRole;
  status: UserStatus;
  expiresAt: string | null;
  initials: string;
}

export interface SessionRecord {
  id: string;
  userId: string | null;
  scope: SessionScope;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  ip: string | null;
  userAgent: string | null;
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    kind: user.kind,
    platformRole: user.platformRole,
    status: user.status,
    expiresAt: user.expiresAt ? user.expiresAt.toISOString() : null,
    initials: userInitials(user.name),
  };
}

export function isUserExpired(user: Pick<UserRecord, 'expiresAt'>, now = new Date()): boolean {
  return user.expiresAt !== null && user.expiresAt.getTime() <= now.getTime();
}

export function isUserAccessAllowed(user: UserRecord, now = new Date()): boolean {
  if (user.status !== 'active') return false;
  if (isUserExpired(user, now)) return false;
  return true;
}
