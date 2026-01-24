'use client';

import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showOnline?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({
  src,
  alt,
  firstName,
  lastName,
  size = 'md',
  className,
  showOnline = false,
  isOnline = false,
}: UserAvatarProps) {
  const sizes = {
    xs: { container: 'w-6 h-6', text: 'text-xs', online: 'w-1.5 h-1.5' },
    sm: { container: 'w-8 h-8', text: 'text-sm', online: 'w-2 h-2' },
    md: { container: 'w-10 h-10', text: 'text-base', online: 'w-2.5 h-2.5' },
    lg: { container: 'w-12 h-12', text: 'text-lg', online: 'w-3 h-3' },
    xl: { container: 'w-16 h-16', text: 'text-xl', online: 'w-3.5 h-3.5' },
    '2xl': { container: 'w-24 h-24', text: 'text-3xl', online: 'w-4 h-4' },
  };

  const sizeClasses = sizes[size];

  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName
      ? firstName[0].toUpperCase()
      : null;

  return (
    <div className={cn('relative inline-flex', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || `${firstName} ${lastName}`}
          className={cn(
            'rounded-full object-cover',
            sizeClasses.container
          )}
        />
      ) : initials ? (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium text-white bg-gradient-to-br from-indigo-500 to-purple-500',
            sizeClasses.container,
            sizeClasses.text
          )}
        >
          {initials}
        </div>
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center bg-muted',
            sizeClasses.container
          )}
        >
          <User className="h-1/2 w-1/2 text-muted-foreground" />
        </div>
      )}
      {showOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            sizeClasses.online,
            isOnline ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
      )}
    </div>
  );
}

// Avatar with name and optional details
interface UserAvatarWithNameProps extends UserAvatarProps {
  name?: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

export function UserAvatarWithName({
  name,
  firstName,
  lastName,
  subtitle,
  badge,
  ...avatarProps
}: UserAvatarWithNameProps) {
  const displayName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName);

  return (
    <div className="flex items-center gap-3">
      <UserAvatar firstName={firstName} lastName={lastName} {...avatarProps} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{displayName}</p>
          {badge}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// Avatar group for showing multiple users
interface AvatarGroupProps {
  users: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarGroup({
  users,
  max = 5,
  size = 'sm',
  className,
}: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const overlapSizes = {
    xs: '-ml-1',
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  return (
    <div className={cn('flex items-center', className)}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className={cn(
            'relative rounded-full ring-2 ring-white',
            index > 0 && overlapSizes[size]
          )}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <UserAvatar
            src={user.avatarUrl}
            firstName={user.firstName}
            lastName={user.lastName}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative rounded-full ring-2 ring-white bg-muted flex items-center justify-center text-muted-foreground font-medium',
            overlapSizes[size],
            size === 'xs' ? 'w-6 h-6 text-xs' :
            size === 'sm' ? 'w-8 h-8 text-xs' :
            size === 'md' ? 'w-10 h-10 text-sm' :
            'w-12 h-12 text-base'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar with level badge
interface LevelAvatarProps extends UserAvatarProps {
  level: number;
}

export function LevelAvatar({ level, ...avatarProps }: LevelAvatarProps) {
  const levelColors: Record<number, string> = {
    1: 'bg-gray-500',
    5: 'bg-green-500',
    10: 'bg-blue-500',
    15: 'bg-purple-500',
    20: 'bg-orange-500',
    25: 'bg-yellow-500',
  };

  const getLevelColor = (lvl: number) => {
    const thresholds = Object.keys(levelColors).map(Number).sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (lvl >= threshold) return levelColors[threshold];
    }
    return 'bg-gray-500';
  };

  return (
    <div className="relative inline-flex">
      <UserAvatar {...avatarProps} />
      <span
        className={cn(
          'absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-xs font-bold text-white ring-2 ring-white',
          getLevelColor(level)
        )}
      >
        {level}
      </span>
    </div>
  );
}

// Avatar with editable state
interface EditableAvatarProps extends UserAvatarProps {
  onEdit?: () => void;
}

export function EditableAvatar({ onEdit, ...avatarProps }: EditableAvatarProps) {
  return (
    <div className="relative inline-flex group">
      <UserAvatar {...avatarProps} />
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <span className="text-white text-xs font-medium">Edit</span>
        </button>
      )}
    </div>
  );
}
