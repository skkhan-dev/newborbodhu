"use client";

import { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
};

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchable = false,
  multiple = false,
  selectedValues,
  onMultiChange,
}: {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  selectedValues?: string[];
  onMultiChange?: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const selectedLabel = multiple
    ? selectedValues?.length
      ? `${selectedValues.length} selected`
      : placeholder
    : options.find((o) => o.value === value)?.label ?? placeholder;

  function handleSelect(opt: DropdownOption) {
    if (multiple && onMultiChange && selectedValues) {
      const next = selectedValues.includes(opt.value)
        ? selectedValues.filter((v) => v !== opt.value)
        : [...selectedValues, opt.value];
      onMultiChange(next);
    } else {
      onChange?.(opt.value);
      setOpen(false);
      setSearch("");
    }
  }

  return (
    <div className="dropdown-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`dropdown-trigger${open ? " dropdown-trigger-open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className="dropdown-label">{selectedLabel}</span>
        <span className="dropdown-chevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="dropdown-menu">
          {searchable && (
            <input
              type="text"
              className="dropdown-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter…"
              autoFocus
            />
          )}
          <div className="dropdown-options">
            {filtered.length === 0 ? (
              <div className="dropdown-empty">No options found</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = multiple
                  ? selectedValues?.includes(opt.value)
                  : opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`dropdown-option${isSelected ? " dropdown-option-selected" : ""}`}
                    onClick={() => handleSelect(opt)}
                  >
                    {multiple && (
                      <span className="dropdown-check">
                        {isSelected ? "☑" : "☐"}
                      </span>
                    )}
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
