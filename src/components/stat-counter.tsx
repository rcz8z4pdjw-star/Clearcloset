'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatNumber?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
  formatNumber = true,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      const current = startValue + diff * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = formatNumber
    ? displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : displayValue.toFixed(decimals);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// Counting stat with label
interface StatCounterProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatCounter({
  value,
  label,
  prefix,
  suffix,
  icon,
  trend,
  size = 'md',
  className,
}: StatCounterProps) {
  const sizes = {
    sm: {
      value: 'text-xl',
      label: 'text-xs',
      icon: 'h-4 w-4',
    },
    md: {
      value: 'text-3xl',
      label: 'text-sm',
      icon: 'h-5 w-5',
    },
    lg: {
      value: 'text-4xl',
      label: 'text-base',
      icon: 'h-6 w-6',
    },
  };

  const sizeClasses = sizes[size];

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2">
        {icon && <div className={cn('text-muted-foreground', sizeClasses.icon)}>{icon}</div>}
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className={cn('font-bold', sizeClasses.value)}
        />
        {trend && (
          <span className={cn(
            'text-xs font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <span className={cn('text-muted-foreground', sizeClasses.label)}>{label}</span>
    </div>
  );
}

// XP counter with level indicator
interface XPCounterProps {
  currentXP: number;
  level: number;
  xpForNextLevel: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function XPCounter({
  currentXP,
  level,
  xpForNextLevel,
  showProgress = true,
  size = 'md',
  className,
}: XPCounterProps) {
  const sizes = {
    sm: { text: 'text-lg', level: 'text-xs', progress: 'h-1.5' },
    md: { text: 'text-2xl', level: 'text-sm', progress: 'h-2' },
    lg: { text: 'text-3xl', level: 'text-base', progress: 'h-3' },
  };

  const sizeClasses = sizes[size];
  const progress = xpForNextLevel > 0 ? (currentXP / xpForNextLevel) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline gap-2">
        <AnimatedCounter
          value={currentXP}
          className={cn('font-bold text-indigo-600', sizeClasses.text)}
        />
        <span className={cn('text-muted-foreground', sizeClasses.level)}>
          / {xpForNextLevel.toLocaleString()} XP
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn('font-medium', sizeClasses.level)}>Level {level}</span>
        {showProgress && (
          <div className={cn('flex-1 bg-gray-200 rounded-full overflow-hidden', sizeClasses.progress)}>
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Streak counter with fire animation
interface StreakCounterProps {
  streak: number;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StreakCounter({
  streak,
  isActive = true,
  size = 'md',
  className,
}: StreakCounterProps) {
  const sizes = {
    sm: { text: 'text-lg', icon: 'text-xl' },
    md: { text: 'text-2xl', icon: 'text-3xl' },
    lg: { text: 'text-4xl', icon: 'text-5xl' },
  };

  const sizeClasses = sizes[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(
        sizeClasses.icon,
        isActive && 'animate-pulse'
      )}>
        🔥
      </span>
      <div>
        <AnimatedCounter
          value={streak}
          className={cn('font-bold', sizeClasses.text)}
        />
        <span className="text-muted-foreground text-sm ml-1">day streak</span>
      </div>
    </div>
  );
}

// Currency display with animation
interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  previousAmount?: number;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency = '$',
  size = 'md',
  showChange = false,
  previousAmount,
  className,
}: CurrencyDisplayProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const change = previousAmount !== undefined ? amount - previousAmount : 0;
  const percentChange = previousAmount && previousAmount > 0
    ? ((amount - previousAmount) / previousAmount) * 100
    : 0;

  return (
    <div className={cn('flex flex-col', className)}>
      <AnimatedCounter
        value={amount}
        prefix={currency}
        decimals={2}
        className={cn('font-bold', sizes[size])}
      />
      {showChange && previousAmount !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-sm',
          change >= 0 ? 'text-green-600' : 'text-red-600'
        )}>
          <span>{change >= 0 ? '+' : ''}{currency}{Math.abs(change).toFixed(2)}</span>
          <span>({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)</span>
        </div>
      )}
    </div>
  );
}

// Countdown timer
interface CountdownTimerProps {
  targetDate: Date | string;
  onComplete?: () => void;
  showDays?: boolean;
  className?: string;
}

export function CountdownTimer({
  targetDate,
  onComplete,
  showDays = true,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  return (
    <div className={cn('flex items-center gap-2 font-mono', className)}>
      {showDays && timeLeft.days > 0 && (
        <>
          <div className="text-center">
            <span className="text-2xl font-bold">{timeLeft.days}</span>
            <span className="text-xs text-muted-foreground block">days</span>
          </div>
          <span className="text-xl">:</span>
        </>
      )}
      <div className="text-center">
        <span className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground block">hrs</span>
      </div>
      <span className="text-xl">:</span>
      <div className="text-center">
        <span className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground block">min</span>
      </div>
      <span className="text-xl">:</span>
      <div className="text-center">
        <span className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground block">sec</span>
      </div>
    </div>
  );
}
