"use client";

import { type ReactNode } from "react";

export type AccordionItem = {
  key: string;
  title: string;
  content: ReactNode;
};

export function Accordion({
  items,
  allowMultiple = false,
}: {
  items: AccordionItem[];
  allowMultiple?: boolean;
}) {
  return (
    <div className="accordion">
      {items.map((item) => (
        <details
          key={item.key}
          className="accordion-item"
          name={allowMultiple ? undefined : "accordion"}
        >
          <summary className="accordion-trigger">{item.title}</summary>
          <div className="accordion-content">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
