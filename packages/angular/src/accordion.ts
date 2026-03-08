import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import {
  type AccordionItem,
  type AccordionType,
  DEFAULT_ACCORDION_ITEMS,
  nextOpenIds,
} from "./accordion-utils.js";

@Component({
  selector: "foundry-accordion",
  standalone: true,
  imports: [CommonModule],
  inputs: ["items", "type", "defaultOpenIds", "ariaLabel"],
  template: `
    <div class="w-full rounded-lg border bg-card text-card-foreground shadow-sm" role="presentation" [attr.aria-label]="ariaLabel">
      <section *ngFor="let item of items" class="border-b last:border-b-0">
        <h3>
          <button
            [id]="item.id + '-trigger'"
            type="button"
            [attr.aria-controls]="item.id + '-content'"
            [attr.aria-expanded]="isOpen(item.id)"
            [disabled]="item.disabled"
            class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            (click)="toggle(item.id)"
          >
            <span>{{ item.trigger }}</span>
            <span class="text-xs text-muted-foreground">{{ isOpen(item.id) ? 'Open' : 'Closed' }}</span>
          </button>
        </h3>

        <div
          [id]="item.id + '-content'"
          role="region"
          [attr.aria-labelledby]="item.id + '-trigger'"
          [hidden]="!isOpen(item.id)"
          class="px-4 pb-4 pt-1 text-sm text-muted-foreground"
        >
          {{ item.content }}
        </div>
      </section>
    </div>
  `,
})
export class AccordionComponent {
  items: AccordionItem[] = DEFAULT_ACCORDION_ITEMS;
  type: AccordionType = "single";
  defaultOpenIds: string[] = ["item-1"];
  ariaLabel = "Accordion";

  openIds: string[] = [...this.defaultOpenIds];

  ngOnChanges(): void {
    this.openIds = [...this.defaultOpenIds];
  }

  toggle(id: string): void {
    this.openIds = nextOpenIds(this.openIds, id, this.type);
  }

  isOpen(id: string): boolean {
    return this.openIds.includes(id);
  }
}

export { DEFAULT_ACCORDION_ITEMS, nextOpenIds } from "./accordion-utils.js";
export type { AccordionItem, AccordionType } from "./accordion-utils.js";
