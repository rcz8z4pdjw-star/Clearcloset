'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  valueLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 'md',
  strokeWidth,
  color = 'stroke-indigo-500',
  backgroundColor = 'stroke-gray-200',
  showValue = true,
  valueLabel,
  className,
  children,
}: ProgressRingProps) {
  const sizes = {
    sm: { width: 48, stroke: 4 },
    md: { width: 80, stroke: 6 },
    lg: { width: 120, stroke: 8 },
    xl: { width: 160, stroke: 10 },
  };

  const { width, stroke } = sizes[size];
  const finalStroke = strokeWidth || stroke;
  const radius = (width - finalStroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clampedProgress / 100) * circumference;

  const valueSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={width}
        height={width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          strokeWidth={finalStroke}
          className={backgroundColor}
        />
        {/* Progress circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          strokeWidth={finalStroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(color, 'transition-all duration-500 ease-out')}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <div className="text-center">
            <span className={cn('font-bold', valueSizes[size])}>
              {Math.round(clampedProgress)}%
            </span>
            {valueLabel && (
              <p className="text-xs text-muted-foreground">{valueLabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Multi-segment ring for showing multiple progress values
interface MultiProgressRingProps {
  segments: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  className?: string;
  showLegend?: boolean;
}

export function MultiProgressRing({
  segments,
  size = 'md',
  strokeWidth,
  className,
  showLegend = false,
}: MultiProgressRingProps) {
  const sizes = {
    sm: { width: 48, stroke: 4 },
    md: { width: 80, stroke: 6 },
    lg: { width: 120, stroke: 8 },
    xl: { width: 160, stroke: 10 },
  };

  const { width, stroke } = sizes[size];
  const finalStroke = strokeWidth || stroke;
  const radius = (width - finalStroke) / 2;
  const circumference = radius * 2 * Math.PI;

  // Calculate total and percentages
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  let currentOffset = 0;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={width}
          height={width}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            strokeWidth={finalStroke}
            className="stroke-gray-200"
          />
          {/* Segment circles */}
          {segments.map((segment, index) => {
            const percentage = total > 0 ? (segment.value / total) * 100 : 0;
            const segmentLength = (percentage / 100) * circumference;
            const offset = currentOffset;
            currentOffset += segmentLength;

            return (
              <circle
                key={index}
                cx={width / 2}
                cy={width / 2}
                r={radius}
                fill="none"
                strokeWidth={finalStroke}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className={cn(segment.color, 'transition-all duration-500')}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{total}</span>
        </div>
      </div>
      {showLegend && (
        <div className="space-y-1">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className={cn('w-3 h-3 rounded-full', segment.color.replace('stroke-', 'bg-'))} />
              <span className="text-muted-foreground">{segment.label}</span>
              <span className="font-medium">{segment.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Circular progress with icon in center
interface IconProgressRingProps {
  progress: number;
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function IconProgressRing({
  progress,
  icon,
  size = 'md',
  color = 'stroke-indigo-500',
  className,
}: IconProgressRingProps) {
  const sizes = {
    sm: { width: 48, stroke: 3, iconSize: 'h-5 w-5' },
    md: { width: 64, stroke: 4, iconSize: 'h-6 w-6' },
    lg: { width: 80, stroke: 5, iconSize: 'h-8 w-8' },
  };

  const { width, stroke, iconSize } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={width} height={width} className="transform -rotate-90">
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200"
        />
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(color, 'transition-all duration-500')}
        />
      </svg>
      <div className={cn('absolute', iconSize)}>
        {icon}
      </div>
    </div>
  );
}

// Goal progress ring with milestone markers
interface GoalProgressRingProps {
  current: number;
  target: number;
  milestones?: number[];
  size?: 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export function GoalProgressRing({
  current,
  target,
  milestones = [],
  size = 'lg',
  color = 'stroke-green-500',
  className,
}: GoalProgressRingProps) {
  const sizes = {
    md: { width: 100, stroke: 8 },
    lg: { width: 140, stroke: 10 },
    xl: { width: 180, stroke: 12 },
  };

  const { width, stroke } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={width} height={width} className="transform -rotate-90">
        {/* Background */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200"
        />
        {/* Progress */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(color, 'transition-all duration-500')}
        />
        {/* Milestone markers */}
        {milestones.map((milestone, index) => {
          const angle = ((milestone / target) * 360 - 90) * (Math.PI / 180);
          const x = width / 2 + radius * Math.cos(angle);
          const y = width / 2 + radius * Math.sin(angle);
          const isPassed = current >= milestone;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={4}
              className={isPassed ? 'fill-green-500' : 'fill-gray-400'}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold">${current.toLocaleString()}</span>
        <span className="text-sm text-muted-foreground">of ${target.toLocaleString()}</span>
      </div>
    </div>
  );
}
