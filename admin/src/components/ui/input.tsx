import * as React from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import { cn } from '../../lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof BaseInput>>(
  ({ className, ...props }, ref) => (
    <BaseInput
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-brand-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
