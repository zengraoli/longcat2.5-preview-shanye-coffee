import * as React from 'react';
import { Switch } from '@base-ui/react/switch';
import { cn } from '../../lib/utils';

const SwitchRoot = Switch.Root;
const SwitchThumb = Switch.Thumb;

function SwitchView({ className, ...props }: React.ComponentProps<typeof SwitchRoot>) {
  return (
    <SwitchRoot
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-brand-600 data-[unchecked]:bg-brand-200',
        className,
      )}
      {...props}
    >
      <SwitchThumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[checked]:translate-x-4 data-[unchecked]:translate-x-0',
        )}
      />
    </SwitchRoot>
  );
}

export { SwitchView as Switch };
