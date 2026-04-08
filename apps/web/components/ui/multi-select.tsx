"use client";

import { useState, useRef, useEffect } from "react";

type Option = { value: string; label: string };

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  maxDisplay?: number;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  label,
  searchable = false,
  maxDisplay = 2,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  const displayText = () => {
    if (selected.length === 0) return placeholder;
    const labels = selected.map((v) => options.find((o) => o.value === v)?.label ?? v);
    if (labels.length <= maxDisplay) return labels.join(", ");
    return `${labels.slice(0, maxDisplay).join(", ")} +${labels.length - maxDisplay}`;
  };

  return (
    <div className="multi-select" ref={ref}>
      {label && <span className="multi-select-label">{label}</span>}
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen(!open)}
      >
        <span className={selected.length ? "multi-select-value" : "multi-select-placeholder"}>
          {displayText()}
        </span>
        <span className="multi-select-arrow">{open ? "▴" : "▾"}</span>
      </button>

      {open && <div className="multi-select-backdrop" onClick={() => setOpen(false)} />}
      {open && (
        <div className="multi-select-dropdown">
          {searchable && (
            <input
              type="text"
              className="multi-select-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}
          <div className="multi-select-actions">
            <button type="button" onClick={() => onChange(options.map((o) => o.value))}>All</button>
            <button type="button" onClick={() => { onChange([]); setSearch(""); }}>Clear</button>
          </div>
          <div className="multi-select-list">
            {filtered.map((opt) => (
              <label key={opt.value} className="multi-select-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {filtered.length === 0 && <p className="multi-select-empty">No matches</p>}
          </div>
        </div>
      )}
    </div>
  );
}
