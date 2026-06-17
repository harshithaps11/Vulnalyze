import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  status?: 'online' | 'offline';
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className,
  status
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = alt
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative inline-block">
      {hasError || !src ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-dark-700 text-xs font-semibold text-white',
            sizeClasses[size],
            className
          )}
          aria-label={alt}
        >
          {initials || '?'}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className={cn(
            'rounded-full object-cover',
            sizeClasses[size],
            className
          )}
        />
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full border-2 border-dark-800',
            {
              'bg-severity-low': status === 'online',
              'bg-dark-400': status === 'offline',
              'h-2.5 w-2.5': size === 'sm',
              'h-3 w-3': size === 'md',
              'h-3.5 w-3.5': size === 'lg',
            }
          )}
        />
      )}
    </div>
  );
}