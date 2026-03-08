import type { Emitter, TransformedComponent } from "@shadcnui-foundry/core";
import type {
  ComponentIR,
  GeneratedFile,
  PipelineResult,
  Prop,
  Variant,
} from "@shadcnui-foundry/ir";

function mapBaseElement(role: string | undefined): string {
  switch (role) {
    case "button":
      return "button";
    case "textbox":
      return "input";
    default:
      return "div";
  }
}

function toPropKey(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : `"${name}"`;
}

function ensureVariantProps(props: Prop[], variants: Variant[]): Prop[] {
  const merged = new Map<string, Prop>();

  for (const prop of props) {
    merged.set(prop.name, prop);
  }

  for (const variant of variants) {
    if (merged.has(variant.name)) {
      continue;
    }

    merged.set(variant.name, {
      name: variant.name,
      type: "enum",
      values: variant.values,
      required: false,
      ...(variant.defaultValue !== undefined && { defaultValue: `"${variant.defaultValue}"` }),
      forwarded: false,
      description: `Variant: ${variant.name}`,
    });
  }

  return [...merged.values()].filter((prop) => prop.name !== "children");
}

function mapPropType(prop: Prop): string {
  if ((prop.type === "enum" || prop.type === "union") && prop.values && prop.values.length > 0) {
    return prop.values.map((value) => `"${value}"`).join(" | ");
  }

  switch (prop.type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return "unknown[]";
    case "object":
      return "Record<string, unknown>";
    case "function":
      return "(...args: unknown[]) => unknown";
    default:
      return "unknown";
  }
}

function inferDefault(prop: Prop): string | undefined {
  if (prop.defaultValue !== undefined) {
    return prop.defaultValue;
  }

  if (prop.type === "boolean") {
    return "false";
  }

  return undefined;
}

export class SvelteEmitter implements Emitter {
  readonly framework = "svelte";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const isOverlayComponent = ["dialog", "popover", "dropdown-menu", "select"].includes(
      transformed.componentId,
    );
    const ir = (transformed.spec as { ir?: ComponentIR }).ir;
    const mergedProps = ir ? ensureVariantProps(ir.props, ir.variants) : [];
    const a11yAttrs = ir
      ? [...new Set([...ir.a11y.requiredAttributes, ...ir.a11y.optionalAttributes])].filter(
          (attr) => attr.startsWith("aria-"),
        )
      : [];

    const allProps: Prop[] = [
      ...mergedProps,
      ...a11yAttrs
        .filter((attr) => !mergedProps.some((prop) => prop.name === attr))
        .map((attr) => ({
          name: attr,
          type: "string" as const,
          required: false,
          forwarded: false,
          description: `Accessibility attribute: ${attr}`,
        })),
    ];

    const propsLines = allProps
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((prop) => {
        const key = toPropKey(prop.name);
        const optionalSuffix = prop.required ? "" : "?";
        const description = prop.description ? `  /** ${prop.description} */\n` : "";
        return `${description}  ${key}${optionalSuffix}: ${mapPropType(prop)};`;
      });

    const defaultsLines = allProps
      .map((prop) => {
        const defaultValue = inferDefault(prop);
        if (defaultValue === undefined) {
          return null;
        }
        return `  ${toPropKey(prop.name)}: ${defaultValue},`;
      })
      .filter((line): line is string => typeof line === "string");

    const variantDataAttrs = ir
      ? ir.variants
          .map((variant) => `  data-${variant.name}={propsWithDefaults.${variant.name}}`)
          .join("\n")
      : "";

    const ariaBindings = allProps
      .filter((prop) => prop.name.startsWith("aria-"))
      .map((prop) => `  {${prop.name}}={propsWithDefaults[\"${prop.name}\"]}`)
      .join("\n");

    const role = ir?.a11y.roles[0];
    const roleLine = role ? `  role=\"${role}\"\n` : "";
    const tag = mapBaseElement(role);
    const overlayScript = isOverlayComponent
      ? `
  let open = $state(false);

  function onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      open = false;
      return;
    }

    if (event.key !== "Tab") return;

    const node = document.querySelector<HTMLElement>("[data-foundry-overlay=\"${transformed.componentId}\"]");
    if (!node) return;
    const focusable = node.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function portal(node: HTMLElement) {
    // Portal rendering strategy: mount overlays directly under document.body.
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) node.parentNode.removeChild(node);
      },
    };
  }

  $effect(() => {
    document.addEventListener("keydown", onDocumentKeydown);
    return () => document.removeEventListener("keydown", onDocumentKeydown);
  });
`
      : "";

    const overlayScriptBlock = overlayScript.length > 0 ? `\n${overlayScript}` : "";

    const overlayTemplateOpen = isOverlayComponent
      ? `<button type=\"button\" class=\"${transformed.componentId}-trigger\" onclick={() => (open = true)}>Open</button>

{#if open}
  <${tag}
    use:portal
    data-foundry-overlay=\"${transformed.componentId}\"`
      : `<${tag}`;
    const overlayTemplateClose = isOverlayComponent
      ? `  >
    <slot />
  </${tag}>
{/if}`
      : `>
  <slot />
</${tag}>`;

    const content = `<!-- @generated by shadcnui-foundry — DO NOT EDIT MANUALLY -->
<!-- Run \`foundry generate ${transformed.componentId}\` to regenerate -->
<script lang="ts">
  interface Props {
${propsLines.join("\n")}
    class?: string;
  }

  let props: Props = $props();
  const defaultProps = {
${defaultsLines.join("\n")}
  } as const;

  let propsWithDefaults = $derived({ ...defaultProps, ...props });
  let className = $derived(["${transformed.componentId}", propsWithDefaults.class].filter(Boolean).join(" "));
${overlayScriptBlock}</script>

${overlayTemplateOpen}
${roleLine}${variantDataAttrs}
${ariaBindings}
  class={className}
${overlayTemplateClose}
`;
    return {
      success: true,
      data: [
        {
          path: `${transformed.componentId}/${transformed.componentId}.svelte`,
          content,
          componentId: transformed.componentId,
          framework: "svelte",
          generated: true,
          irHash: "",
        },
      ],
    };
  }
}
