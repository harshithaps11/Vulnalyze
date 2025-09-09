import React from 'react';
import { cn, getProgressColor } from '../../lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function Progress({ 
  value, 
  max = 100, 
  className,
  showLabel = false,
  size = 'md',
  color
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={cn('relative w-full overflow-hidden rounded-full bg-dark-700', sizeClasses[size], className)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300 ease-in-out', 
            color || getProgressColor(percentage)
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-dark-400 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}