import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'default';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        {
          'badge-critical': variant === 'critical',
          'badge-high': variant === 'high',
          'badge-medium': variant === 'medium',
          'badge-low': variant === 'low',
          'badge-info': variant === 'info',
          'bg-dark-700 text-dark-300': variant === 'default',
        },
        className
      )}
    >
      {children}
    </span>
  );
}