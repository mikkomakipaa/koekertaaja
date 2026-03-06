"use client";

import { useEffect, useRef } from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TabValue = string;

export interface Tab<T extends TabValue = TabValue> {
  value: T;
  label: string;
  badge?: number;
  adminOnly?: boolean;
}

interface ARIATabBarProps<T extends TabValue = TabValue> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (value: T) => void;
  isAdmin?: boolean;
  className?: string;
}

export function ARIATabBar<T extends TabValue = TabValue>({
  tabs,
  activeTab,
  onTabChange,
  isAdmin = false,
  className
}: ARIATabBarProps<T>) {
  const tabsListRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view on mobile
  useEffect(() => {
    const activeTabElement = tabsListRef.current?.querySelector(
      `[data-state="active"]`
    ) as HTMLElement;

    if (activeTabElement && tabsListRef.current) {
      activeTabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }
  }, [activeTab]);

  // Filter tabs based on admin status
  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  // Keyboard navigation with roving tabindex
  const handleKeyDown = (e: React.KeyboardEvent, currentValue: T) => {
    const currentIndex = visibleTabs.findIndex(tab => tab.value === currentValue);
    let newIndex = currentIndex;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      newIndex = currentIndex === 0 ? visibleTabs.length - 1 : currentIndex - 1;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      newIndex = currentIndex === visibleTabs.length - 1 ? 0 : currentIndex + 1;
    } else if (e.key === "Home") {
      e.preventDefault();
      newIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      newIndex = visibleTabs.length - 1;
    }

    if (newIndex !== currentIndex) {
      const nextTab = visibleTabs[newIndex];
      onTabChange(nextTab.value);

      // Focus the new tab
      setTimeout(() => {
        const nextTabElement = tabsListRef.current?.querySelector(
          `[data-value="${nextTab.value}"]`
        ) as HTMLElement;
        nextTabElement?.focus();
      }, 0);
    }
  };

  // Wrapper to handle Radix's string type
  const handleValueChange = (value: string) => {
    onTabChange(value as T);
  };

  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={handleValueChange}
      className={className}
    >
      <TabsPrimitive.List
        ref={tabsListRef}
        className={cn(
          "flex items-center gap-1 overflow-x-auto",
          "rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900",
          "px-1",
          // Hide scrollbar but keep functionality
          "scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          const tabIndex = isActive ? 0 : -1; // Roving tabindex

          return (
            <TabsPrimitive.Trigger
              key={tab.value}
              value={tab.value}
              data-value={tab.value}
              tabIndex={tabIndex}
              onKeyDown={(e) => handleKeyDown(e, tab.value)}
              className={cn(
                // Layout
                "relative flex items-center justify-center gap-2",
                "min-h-[42px] px-3 sm:px-4 py-2",
                "whitespace-nowrap flex-shrink-0",
                "rounded-xl",

                // Typography
                "text-sm font-medium md:text-base",

                // States
                "transition-all duration-200",

                // Inactive state
                "text-slate-600",
                "hover:text-slate-900 hover:bg-slate-100/80",
                "dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800",

                // Active state
                "data-[state=active]:text-slate-900",
                "data-[state=active]:bg-slate-100",
                "dark:data-[state=active]:text-slate-100 dark:data-[state=active]:bg-slate-800",

                // Focus state
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                "dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-slate-900"
              )}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="count" size="sm">
                  {tab.badge}
                </Badge>
              )}
            </TabsPrimitive.Trigger>
          );
        })}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
