<script lang="ts">
  import { getButtonClassName, type ButtonSize, type ButtonVariant } from "./button.js";

  export let variant: ButtonVariant = "default";
  export let size: ButtonSize = "default";
  export let type: "button" | "submit" | "reset" = "button";
  export let disabled = false;
  export let ariaLabel: string | undefined = undefined;
  export let className = "";
</script>

<button
  type={type}
  disabled={disabled}
  aria-label={ariaLabel}
  class={getButtonClassName(variant, size, className)}
  on:click
>
  <slot>Button</slot>
</button>
