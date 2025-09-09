import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  isHoverable?: boolean;
}

export function Card({ 
  children, 
  className, 
  title, 
  subtitle, 
  footer,
  isHoverable = false 
}: CardProps) {
  return (
    <div
      className={cn(
        'card',
        isHoverable && 'transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl',
        className
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-dark-100">{title}</h3>}
          {subtitle && <p className="text-sm text-dark-400 mt-1">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-dark-700">{footer}</div>}
    </div>
  );
}