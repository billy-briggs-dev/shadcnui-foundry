<script lang="ts">
  import { DEFAULT_ACCORDION_ITEMS, nextOpenIds, type AccordionItem, type AccordionType } from "./accordion.js";

  export let items: AccordionItem[] = DEFAULT_ACCORDION_ITEMS;
  export let type: AccordionType = "single";
  export let defaultOpenIds: string[] = ["item-1"];
  export let ariaLabel = "Accordion";

  let openIds: string[] = [...defaultOpenIds];

  function toggle(id: string): void {
    openIds = nextOpenIds(openIds, id, type);
  }
</script>

<div class="w-full rounded-lg border bg-card text-card-foreground shadow-sm" role="presentation" aria-label={ariaLabel}>
  {#each items as item (item.id)}
    {@const isOpen = openIds.includes(item.id)}
    <section class="border-b last:border-b-0">
      <h3>
        <button
          id={`${item.id}-trigger`}
          type="button"
          aria-controls={`${item.id}-content`}
          aria-expanded={isOpen}
          disabled={item.disabled}
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          on:click={() => toggle(item.id)}
        >
          <span>{item.trigger}</span>
          <span class="text-xs text-muted-foreground">{isOpen ? "Open" : "Closed"}</span>
        </button>
      </h3>
      <div
        id={`${item.id}-content`}
        role="region"
        aria-labelledby={`${item.id}-trigger`}
        hidden={!isOpen}
        class="px-4 pb-4 pt-1 text-sm text-muted-foreground"
      >
        {item.content}
      </div>
    </section>
  {/each}
</div>
