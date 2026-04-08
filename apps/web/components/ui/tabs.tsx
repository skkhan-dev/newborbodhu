"use client";

import { type ReactNode } from "react";

export type TabItem = {
  key: string;
  label: string;
  count?: number;
};

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="tab-nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={`tab-btn${activeTab === tab.key ? " tab-btn-active" : ""}`}
            aria-selected={activeTab === tab.key}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
            {tab.count != null && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
      {children && (
        <div className="tab-content" role="tabpanel">
          {children}
        </div>
      )}
    </div>
  );
}
