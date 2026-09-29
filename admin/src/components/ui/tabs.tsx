import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { cn } from '../../lib/utils';

const TabsRoot = Tabs.Root;
const TabsList = Tabs.List;
const TabsTab = Tabs.Tab;
const TabsPanel = Tabs.Panel;

function TabsListView({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-brand-100 p-1 text-brand-700',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsTab>) {
  return (
    <TabsTab
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-white data-[selected]:text-brand-900 data-[selected]:shadow',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPanel>) {
  return (
    <TabsPanel
      className={cn('mt-2 focus-visible:outline-none', className)}
      {...props}
    />
  );
}

export { TabsRoot as Tabs, TabsListView as TabsList, TabsTrigger, TabsContent };
