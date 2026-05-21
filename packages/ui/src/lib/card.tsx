import * as React from 'react';

import { cn } from './utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[28px] border border-stone-200 bg-white/90 p-6 shadow-[0_18px_60px_-40px_rgba(28,25,23,0.45)] backdrop-blur',
        className,
      )}
      {...props}
    />
  );
}
