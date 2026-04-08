"use client";

export type SidebarSection = {
  label?: string;
  items: SidebarItem[];
};

export type SidebarItem = {
  key: string;
  label: string;
  icon?: string;
  count?: number;
};

export function SidebarNav({
  sections,
  activeKey,
  onNavigate,
}: {
  sections: SidebarSection[];
  activeKey: string;
  onNavigate: (key: string) => void;
}) {
  return (
    <nav className="sidebar-nav">
      {sections.map((section, si) => (
        <div key={si} className="sidebar-section">
          {section.label && (
            <div className="sidebar-label">{section.label}</div>
          )}
          {section.items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-item${activeKey === item.key ? " sidebar-item-active" : ""}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>}
              <span className="sidebar-text">{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span className="sidebar-count">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
