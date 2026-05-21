import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-stone-900 px-5 py-2.5 text-white hover:bg-stone-800',
        secondary: 'bg-stone-100 px-5 py-2.5 text-stone-900 hover:bg-stone-200',
        ghost: 'px-4 py-2 text-stone-700 hover:bg-stone-100',
        outline: 'border border-stone-300 px-5 py-2.5 text-stone-900 hover:bg-stone-50',
      },
      size: {
        default: 'h-11',
        sm: 'h-9 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);

Button.displayName = 'Button';
