"use client";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tab types                                                          */
/* ------------------------------------------------------------------ */

export type Tab = {
  id: string;
  label: string;
  disabled?: boolean;
};

/* ------------------------------------------------------------------ */
/* TabList                                                            */
/* ------------------------------------------------------------------ */

export type TabListProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
};

export function TabList({ tabs, activeTab, onChange, className }: TabListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 border-b border-gray-200",
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          disabled={tab.disabled}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4d4bf7] focus-visible:ring-inset",
            "disabled:cursor-not-allowed disabled:opacity-50",
            activeTab === tab.id
              ? "text-[#4d4bf7]"
              : "text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.label}
          {/* Active underline indicator */}
          {activeTab === tab.id && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#4d4bf7]" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TabPanel                                                           */
/* ------------------------------------------------------------------ */

export type TabPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  tabId: string;
  activeTab: string;
};

export function TabPanel({
  tabId,
  activeTab,
  className,
  children,
  ...props
}: TabPanelProps) {
  if (activeTab !== tabId) return null;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${tabId}`}
      aria-labelledby={`tab-${tabId}`}
      className={cn("py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
