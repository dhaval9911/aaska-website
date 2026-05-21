import * as React from 'react';

import { cn } from './utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-900 shadow-sm outline-none transition focus:border-stone-500',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';
