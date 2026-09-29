import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { cn } from '../../lib/utils';

const SelectRoot = Select.Root;
const SelectTrigger = Select.Trigger;
const SelectValue = Select.Value;
const SelectIcon = Select.Icon;
const SelectPortal = Select.Portal;
const SelectPositioner = Select.Positioner;
const SelectPopup = Select.Popup;
const SelectItem = Select.Item;
const SelectArrow = Select.Arrow;

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPopup>) {
  return (
    <SelectPortal>
      <SelectPositioner className="z-50">
        <SelectPopup
          className={cn(
            'min-w-[8rem] overflow-hidden rounded-md border border-brand-100 bg-white p-1 text-brand-900 shadow-md',
            className,
          )}
          {...props}
        >
          {children}
        </SelectPopup>
      </SelectPositioner>
    </SelectPortal>
  );
}

function SelectItemView({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectItem>) {
  return (
    <SelectItem
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-brand-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <Select.ItemIndicator>
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Select.ItemIndicator>
      </span>
      <Select.ItemText>{children}</Select.ItemText>
    </SelectItem>
  );
}

export {
  SelectRoot as Select,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItemView as SelectItem,
  SelectArrow,
};
