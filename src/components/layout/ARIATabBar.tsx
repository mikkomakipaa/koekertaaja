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
          "flex overflow-x-auto",
          "border-b border-border",
          "px-4 sm:px-6 md:px-8",
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
                "min-h-[44px] px-3 sm:px-4 py-2",
                "whitespace-nowrap flex-shrink-0",

                // Typography
                "text-sm font-medium",

                // States
                "transition-all duration-200",

                // Inactive state
                "text-muted-foreground",
                "hover:text-foreground hover:bg-accent/50",

                // Active state
                "data-[state=active]:text-foreground",
                "data-[state=active]:bg-accent/30",

                // Focus state
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2",

                // Active indicator (bottom border)
                "before:absolute before:bottom-0 before:left-0 before:right-0",
                "before:h-0.5 before:bg-primary before:opacity-0",
                "before:transition-opacity before:duration-200",
                "data-[state=active]:before:opacity-100",

                // Rounded top
                "rounded-t-md"
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
