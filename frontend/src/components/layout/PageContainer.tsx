import React from 'react';
import { cn } from '../../lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageContainer({ 
  children, 
  className, 
  title, 
  description,
  actions 
}: PageContainerProps) {
  return (
    <div className={cn('px-4 py-6 sm:px-6 lg:px-8', className)}>
      {(title || actions) && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
            {description && <p className="mt-1 text-sm text-dark-400">{description}</p>}
          </div>
          {actions && <div className="mt-4 md:mt-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}