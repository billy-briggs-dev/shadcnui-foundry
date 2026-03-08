import type { Emitter, TransformedComponent } from "@shadcnui-foundry/core";
import type { GeneratedFile, PipelineResult } from "@shadcnui-foundry/ir";

type VuePropSpec = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
};

type VueVariantSpec = {
  name: string;
  values: string[];
  defaultValue?: string;
};

type VueA11ySpec = {
  roles: string[];
  requiredAttributes: string[];
  optionalAttributes: string[];
};

type VueSpec = {
  componentName: string;
  propsInterface: VuePropSpec[];
  variants: VueVariantSpec[];
  a11y: VueA11ySpec;
};

function isIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function toPropKey(name: string): string {
  return isIdentifier(name) ? name : `"${name}"`;
}

function escapeJsString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
}

function mapBaseElement(role: string | undefined): string {
  switch (role) {
    case "button":
      return "button";
    case "textbox":
      return "input";
    case "checkbox":
      return "input";
    case "switch":
      return "button";
    case "tab":
      return "button";
    case "menu":
      return "ul";
    case "menuitem":
      return "li";
    case "listbox":
      return "ul";
    case "option":
      return "li";
    case "navigation":
      return "nav";
    case "dialog":
      return "dialog";
    default:
      return "div";
  }
}

function ensureVariantProps(props: VuePropSpec[], variants: VueVariantSpec[]): VuePropSpec[] {
  const merged = new Map<string, VuePropSpec>();

  for (const prop of props) {
    merged.set(prop.name, prop);
  }

  for (const variant of variants) {
    if (merged.has(variant.name)) {
      continue;
    }

    merged.set(variant.name, {
      name: variant.name,
      type: variant.values.map((value) => `"${value}"`).join(" | ") || "string",
      required: false,
      ...(variant.defaultValue !== undefined && {
        defaultValue: `"${escapeJsString(variant.defaultValue)}"`,
      }),
      description: `Variant: ${variant.name}`,
    });
  }

  return [...merged.values()]
    .filter((prop) => prop.name !== "children")
    .sort((a, b) => a.name.localeCompare(b.name));
}

function createA11yProps(a11y: VueA11ySpec): VuePropSpec[] {
  const attrs = [...new Set([...a11y.requiredAttributes, ...a11y.optionalAttributes])].sort(
    (a, b) => a.localeCompare(b),
  );

  return attrs
    .filter((attr) => attr.startsWith("aria-"))
    .map((attr) => ({
      name: attr,
      type: "string",
      required: a11y.requiredAttributes.includes(attr),
      description: `Accessibility attribute: ${attr}`,
    }));
}

function inferDefaultValue(prop: VuePropSpec): string | undefined {
  if (prop.defaultValue !== undefined) {
    return prop.defaultValue;
  }

  if (prop.type === "boolean") {
    return "false";
  }

  return undefined;
}

export class VueEmitter implements Emitter {
  readonly framework = "vue";

  async emit(transformed: TransformedComponent): Promise<PipelineResult<GeneratedFile[]>> {
    const { componentName, propsInterface, variants, a11y } = transformed.spec as VueSpec;
    const isOverlayComponent = ["dialog", "popover", "dropdown-menu", "select"].includes(
      transformed.componentId,
    );
    const primaryRole = a11y.roles[0];
    const tag = mapBaseElement(primaryRole);

    const mergedProps = [...ensureVariantProps(propsInterface, variants), ...createA11yProps(a11y)]
      .filter(
        (prop, index, all) => all.findIndex((candidate) => candidate.name === prop.name) === index,
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const propsLines = mergedProps.map((prop) => {
      const key = toPropKey(prop.name);
      const optionalSuffix = prop.required ? "" : "?";
      const comment = prop.description ? `  /** ${prop.description} */\n` : "";
      return `${comment}  ${key}${optionalSuffix}: ${prop.type};`;
    });

    const defaultsLines = mergedProps
      .map((prop) => {
        const inferred = inferDefaultValue(prop);
        if (inferred === undefined) {
          return null;
        }
        return `  ${toPropKey(prop.name)}: ${inferred},`;
      })
      .filter((line): line is string => typeof line === "string");

    const variantDataAttrs = [...variants]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((variant) => `  :data-${variant.name}="props.${variant.name}"`)
      .join("\n");

    const ariaBindings = mergedProps
      .filter((prop) => prop.name.startsWith("aria-"))
      .map((prop) => `  :${prop.name}="props[\"${prop.name}\"]"`)
      .join("\n");

    const roleBinding = primaryRole ? `  role="${primaryRole}"\n` : "";
    const vueImports = isOverlayComponent
      ? 'import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";'
      : 'import { computed, useAttrs } from "vue";';
    const overlayLogic = isOverlayComponent
      ? `
const open = ref(false);
const overlayRef = ref<HTMLElement | null>(null);

function onDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    open.value = false;
    return;
  }

  if (event.key !== "Tab") return;
  const root = overlayRef.value;
  if (!root) return;

  const focusable = root.querySelectorAll<HTMLElement>(
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

onMounted(() => {
  document.addEventListener("keydown", onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onDocumentKeydown);
});`
      : "";

    const scriptSeparator = overlayLogic.length > 0 ? `\n${overlayLogic}\n\n` : "\n";

    const templateOpen = isOverlayComponent
      ? `  <button type=\"button\" @click=\"open = true\" class=\"${transformed.componentId}-trigger\">Open</button>
  <!-- Portal rendering strategy: use Vue Teleport to mount overlays in document.body -->
  <Teleport to=\"body\">
    <${tag}
      ref=\"overlayRef\"
      v-if=\"open\"`
      : `  <${tag}`;

    const templateClose = isOverlayComponent
      ? `    </${tag}>
  </Teleport>`
      : `  </${tag}>`;

    const content = `<!-- @generated by shadcnui-foundry — DO NOT EDIT MANUALLY -->
<!-- Run \`foundry generate ${transformed.componentId}\` to regenerate -->
<script setup lang="ts">
import { computed, useAttrs } from "vue";

defineOptions({ name: "${componentName}" });

interface ${componentName}Props {
${propsLines.join("\n")}
  class?: string;
}

const props = withDefaults(defineProps<${componentName}Props>(), {
${defaultsLines.join("\n")}
});

const emit = defineEmits<{
  (event: "click", value: MouseEvent): void;
}>();

const attrs = useAttrs();
const className = computed(() => ["${transformed.componentId}", props.class]);${scriptSeparator}
function handleClick(event: MouseEvent): void {
  emit("click", event);
}
</script>

<template>
${templateOpen}
${roleBinding}${variantDataAttrs}
${ariaBindings}
    :class="className"
    v-bind="attrs"
    @click="handleClick"
  >
    <slot />
${templateClose}
</template>
`;

    const finalContent = content.replace('import { computed, useAttrs } from "vue";', vueImports);
    return {
      success: true,
      data: [
        {
          path: `${transformed.componentId}/${componentName}.vue`,
          content: finalContent,
          componentId: transformed.componentId,
          framework: "vue",
          generated: true,
          irHash: "",
        },
      ],
    };
  }
}
