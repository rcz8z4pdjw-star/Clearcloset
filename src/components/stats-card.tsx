'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  variant?: 'default' | 'gradient' | 'outline';
  gradientFrom?: string;
  gradientTo?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  variant = 'default',
  gradientFrom = 'indigo-500',
  gradientTo = 'purple-600',
}: StatsCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  const cardClasses = cn(
    variant === 'gradient' && `bg-gradient-to-br from-${gradientFrom} to-${gradientTo} text-white border-0`,
    variant === 'outline' && 'border-2',
    className
  );

  return (
    <Card className={cardClasses}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn(
              'text-sm',
              variant === 'gradient' ? 'opacity-90' : 'text-muted-foreground'
            )}>
              {title}
            </p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className={cn(
                'text-sm',
                variant === 'gradient' ? 'opacity-75' : 'text-muted-foreground'
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-sm',
                isPositive && (variant === 'gradient' ? 'text-green-200' : 'text-green-600'),
                isNegative && (variant === 'gradient' ? 'text-red-200' : 'text-red-600'),
                !isPositive && !isNegative && 'text-muted-foreground'
              )}>
                {isPositive && <TrendingUp className="h-4 w-4" />}
                {isNegative && <TrendingDown className="h-4 w-4" />}
                {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
                <span>
                  {isPositive ? '+' : ''}{trend.value}%
                  {trend.label && ` ${trend.label}`}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'p-3 rounded-full',
              variant === 'gradient' ? 'bg-white/20' : 'bg-muted'
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'md:grid-cols-2',
      columns === 3 && 'md:grid-cols-3',
      columns === 4 && 'md:grid-cols-4',
      className
    )}>
      {children}
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

export function MiniStat({ label, value, icon, color = 'text-indigo-600' }: MiniStatProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      {icon && (
        <div className={cn('p-2 rounded-full bg-white', color)}>
          {icon}
        </div>
      )}
      <div>
        <p className={cn('text-xl font-bold', color)}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface ProgressStatProps {
  title: string;
  current: number;
  total: number;
  color?: string;
  showPercentage?: boolean;
}

export function ProgressStat({
  title,
  current,
  total,
  color = 'bg-indigo-500',
  showPercentage = true,
}: ProgressStatProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{title}</span>
        <span className="font-medium">
          {current}/{total}
          {showPercentage && ` (${percentage}%)`}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ComparisonStatProps {
  title: string;
  current: number;
  previous: number;
  format?: (value: number) => string;
}

export function ComparisonStat({
  title,
  current,
  previous,
  format = (v) => v.toString(),
}: ComparisonStatProps) {
  const change = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{format(current)}</span>
          <span className={cn(
            'text-sm flex items-center gap-1',
            isPositive && 'text-green-600',
            isNegative && 'text-red-600',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}>
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{change}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Previous: {format(previous)}
        </p>
      </CardContent>
    </Card>
  );
}
