import * as React from "react";

export type AccordionType = "single" | "multiple";

export type AccordionItem = {
  id: string;
  trigger: string;
  content: string;
  disabled?: boolean;
};

export type AccordionProps = {
  items: AccordionItem[];
  type?: AccordionType;
  defaultOpenIds?: string[];
  ariaLabel?: string;
};

export const DEFAULT_ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: "item-1",
    trigger: "What is shadcnui-foundry?",
    content: "A shared multi-framework component library.",
  },
  {
    id: "item-2",
    trigger: "How do I consume components?",
    content: "Import from the framework package index and render directly.",
  },
  {
    id: "item-3",
    trigger: "Is accessibility included?",
    content: "Yes, trigger and region attributes are wired for keyboard/screen readers.",
    disabled: true,
  },
];

export function nextOpenIds(current: string[], id: string, type: AccordionType): string[] {
  const hasId = current.includes(id);
  if (type === "single") {
    return hasId ? [] : [id];
  }
  return hasId ? current.filter((entry) => entry !== id) : [...current, id];
}

export function Accordion({
  items,
  type = "single",
  defaultOpenIds = ["item-1"],
  ariaLabel = "Accordion",
}: AccordionProps): React.JSX.Element {
  const [openIds, setOpenIds] = React.useState<string[]>(defaultOpenIds);

  return (
    <div
      className="w-full rounded-lg border bg-card text-card-foreground shadow-sm"
      role="presentation"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const contentId = `${item.id}-content`;
        const triggerId = `${item.id}-trigger`;
        const isOpen = openIds.includes(item.id);

        return (
          <section key={item.id} className="border-b last:border-b-0">
            <h3>
              <button
                id={triggerId}
                type="button"
                aria-controls={contentId}
                aria-expanded={isOpen}
                disabled={item.disabled}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpenIds((current) => nextOpenIds(current, item.id, type))}
              >
                <span>{item.trigger}</span>
                <span className="text-xs text-muted-foreground">{isOpen ? "Open" : "Closed"}</span>
              </button>
            </h3>
            <section
              id={contentId}
              aria-labelledby={triggerId}
              hidden={!isOpen}
              className="px-4 pb-4 pt-1 text-sm text-muted-foreground"
            >
              {item.content}
            </section>
          </section>
        );
      })}
    </div>
  );
}
