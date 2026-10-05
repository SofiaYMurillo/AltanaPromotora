"use client";

import type { FaqBlock as FaqBlockData } from "./faq.types";

type FaqBlockProps = {
  block: FaqBlockData;
};

function FaqToggleIcon() {
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-accent"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5 group-open:hidden"
        fill="currentColor"
      >
        <rect x="3" y="7" width="10" height="2" rx="0.5" />
        <rect x="7" y="3" width="2" height="10" rx="0.5" />
      </svg>
      <svg
        viewBox="0 0 16 16"
        className="hidden h-3.5 w-3.5 group-open:block"
        fill="currentColor"
      >
        <rect x="3" y="7" width="10" height="2" rx="0.5" />
      </svg>
    </span>
  );
}

export function FaqBlock({ block }: FaqBlockProps) {
  return (
    <div className="faq-accordion-column flex flex-col gap-3">
      {block.items.map((item, index) => (
        <details
          key={item.id}
          className="faq-accordion-item group rounded-xl bg-background"
          open={index === 0}
        >
          <summary className="faq-accordion-summary flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-4 text-left md:px-5">
            <span className="text-body-md font-medium text-foreground group-open:text-accent">
              {item.question}
            </span>
            <FaqToggleIcon />
          </summary>
          <div className="faq-accordion-panel px-4 pb-4 text-body-sm text-secondary md:px-5 md:text-body-md">
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
