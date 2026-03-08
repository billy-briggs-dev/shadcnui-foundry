import type { Analyzer, RawRegistryArtifact } from "@shadcnui-foundry/core";
import type { ComponentIR, PipelineResult, Prop, Variant } from "@shadcnui-foundry/ir";
import { ComponentIRSchema } from "@shadcnui-foundry/ir";
import { classifyComponent } from "./category-classifier.js";

type RegistryFile = {
  path?: string;
  content?: string;
};

type RegistryContent = {
  name: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: RegistryFile[];
};

/**
 * Analyzes a raw shadcn/ui registry artifact into a ComponentIR.
 *
 * This is the normalize stage: raw JSON → validated IR.
 */
export class ShadcnAnalyzer implements Analyzer {
  readonly name = "shadcn-analyzer";

  async analyze(artifact: RawRegistryArtifact): Promise<PipelineResult<ComponentIR>> {
    const raw = artifact.content as RegistryContent;
    const source = this.collectSource(raw.files);
    const variants = this.extractVariants(source);
    const props = this.extractProps(source, variants);

    const now = new Date().toISOString();

    const irData = {
      id: raw.name,
      name: this.toDisplayName(raw.name),
      description: raw.description ?? `The ${raw.name} component.`,
      category: classifyComponent(raw.name),
      props,
      variants,
      a11y: {
        roles: this.inferRoles(raw.name),
        requiredAttributes: this.inferRequiredAttributes(raw.name),
        optionalAttributes: this.inferOptionalAttributes(raw.name),
        keyboardInteractions: this.inferKeyboardInteractions(raw.name),
        focusManagement: this.inferFocusManagement(raw.name),
        liveRegion: this.inferLiveRegion(raw.name),
        wcagCriteria: this.inferWcagCriteria(raw.name),
      },
      dependencies: raw.registryDependencies ?? [],
      tags: [],
      provenance: {
        registry: "shadcn/ui",
        registryName: raw.name,
        fetchedAt: artifact.fetchedAt,
        sourceUrl: artifact.sourceUrl,
      },
      generatedAt: now,
    };

    const parsed = ComponentIRSchema.safeParse(irData);
    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.error.errors.map((e) => ({
          code: "IR_VALIDATION_ERROR",
          message: e.message,
          path: e.path.join("."),
        })),
      };
    }

    return { success: true, data: parsed.data };
  }

  private toDisplayName(name: string): string {
    return name
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }

  private inferRoles(name: string): string[] {
    const roleMap: Record<string, string[]> = {
      button: ["button"],
      dialog: ["dialog"],
      alert: ["alert"],
      "alert-dialog": ["alertdialog"],
      checkbox: ["checkbox"],
      input: ["textbox"],
      select: ["listbox"],
      "radio-group": ["radiogroup"],
      slider: ["slider"],
      switch: ["switch"],
      tabs: ["tablist"],
      tooltip: ["tooltip"],
      "navigation-menu": ["navigation"],
      breadcrumb: ["navigation"],
    };
    return roleMap[name] ?? [];
  }

  private inferRequiredAttributes(name: string): string[] {
    const requiredMap: Record<string, string[]> = {
      dialog: ["aria-modal"],
      "alert-dialog": ["aria-modal"],
      tooltip: ["aria-describedby"],
      tabs: ["aria-controls", "aria-selected"],
      select: ["aria-expanded"],
      "dropdown-menu": ["aria-expanded"],
      popover: ["aria-expanded"],
    };

    return requiredMap[name] ?? [];
  }

  private inferOptionalAttributes(name: string): string[] {
    const optionalMap: Record<string, string[]> = {
      button: ["aria-disabled", "aria-pressed", "aria-expanded"],
      dialog: ["aria-labelledby", "aria-describedby"],
      "alert-dialog": ["aria-labelledby", "aria-describedby"],
      popover: ["aria-controls", "aria-haspopup"],
      "dropdown-menu": ["aria-controls", "aria-haspopup"],
      select: ["aria-controls", "aria-labelledby"],
      tooltip: ["aria-label"],
    };

    return optionalMap[name] ?? [];
  }

  private inferKeyboardInteractions(name: string): Array<{ key: string; description: string }> {
    const keyboardMap: Record<string, Array<{ key: string; description: string }>> = {
      button: [
        { key: "Enter", description: "Activate" },
        { key: "Space", description: "Activate" },
      ],
      dialog: [
        { key: "Escape", description: "Close dialog" },
        { key: "Tab", description: "Move focus within the dialog" },
        { key: "Shift+Tab", description: "Move focus backward within the dialog" },
      ],
      "alert-dialog": [
        { key: "Escape", description: "Close dialog" },
        { key: "Tab", description: "Move focus within the dialog" },
        { key: "Shift+Tab", description: "Move focus backward within the dialog" },
      ],
      popover: [
        { key: "Escape", description: "Close popover" },
        { key: "Tab", description: "Move focus through interactive content" },
      ],
      "dropdown-menu": [
        { key: "Enter", description: "Open menu or activate item" },
        { key: "Space", description: "Open menu or activate item" },
        { key: "ArrowDown", description: "Move to next menu item" },
        { key: "ArrowUp", description: "Move to previous menu item" },
        { key: "Escape", description: "Close menu" },
      ],
      select: [
        { key: "Enter", description: "Open select and choose an option" },
        { key: "Space", description: "Open select" },
        { key: "ArrowDown", description: "Move to next option" },
        { key: "ArrowUp", description: "Move to previous option" },
        { key: "Escape", description: "Close select" },
      ],
      tooltip: [{ key: "Escape", description: "Dismiss tooltip" }],
    };

    return keyboardMap[name] ?? [];
  }

  private inferFocusManagement(name: string): "none" | "auto" | "trap" | "restore" {
    if (name === "dialog" || name === "alert-dialog") {
      return "trap";
    }

    if (name === "popover" || name === "dropdown-menu" || name === "select") {
      return "restore";
    }

    if (name === "tooltip") {
      return "auto";
    }

    return "none";
  }

  private inferLiveRegion(name: string): boolean {
    return name === "alert" || name === "alert-dialog";
  }

  private inferWcagCriteria(name: string): string[] {
    const wcagMap: Record<string, string[]> = {
      button: ["2.1.1", "2.4.7", "4.1.2"],
      dialog: ["2.1.1", "2.4.3", "2.4.7", "4.1.2"],
      "alert-dialog": ["2.1.1", "2.4.3", "2.4.7", "4.1.2"],
      popover: ["2.1.1", "2.4.3", "4.1.2"],
      "dropdown-menu": ["2.1.1", "2.4.3", "4.1.2"],
      select: ["1.3.1", "2.1.1", "4.1.2"],
      tabs: ["2.1.1", "2.4.3", "4.1.2"],
      tooltip: ["1.4.13", "2.1.1", "4.1.2"],
    };

    return wcagMap[name] ?? [];
  }

  private collectSource(files: RegistryFile[] | undefined): string {
    if (!files || files.length === 0) {
      return "";
    }

    const sourceFiles = files.filter(
      (file) =>
        typeof file.content === "string" &&
        typeof file.path === "string" &&
        /\.(ts|tsx|js|jsx|svelte|vue)$/.test(file.path),
    );

    return sourceFiles
      .map((file) => file.content)
      .filter((content): content is string => typeof content === "string")
      .join("\n\n");
  }

  private extractVariants(source: string): Variant[] {
    if (!source.includes("variants:")) {
      return [];
    }

    const variantsSectionMatch = source.match(
      /variants\s*:\s*\{([\s\S]*?)\}\s*,\s*defaultVariants\s*:\s*\{([\s\S]*?)\}/,
    );
    if (!variantsSectionMatch) {
      return [];
    }

    const variantsBlock = variantsSectionMatch[1] ?? "";
    const defaultVariantsBlock = variantsSectionMatch[2] ?? "";
    if (!variantsBlock) {
      return [];
    }

    const defaultMap = this.parseObjectLikeString(defaultVariantsBlock);

    const variantGroups: Variant[] = [];
    const groupRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*\{([\s\S]*?)\}\s*(?:,|$)/g;
    for (const groupMatch of variantsBlock.matchAll(groupRegex)) {
      const variantName = groupMatch[1];
      const variantBody = groupMatch[2];
      if (!variantName || !variantBody) {
        continue;
      }

      const values = this.extractObjectKeys(variantBody);

      if (values.length === 0) {
        continue;
      }

      variantGroups.push({
        name: variantName,
        values,
        defaultValue: defaultMap.get(variantName),
        strategy: "class",
      });
    }

    return variantGroups;
  }

  private extractProps(source: string, variants: Variant[]): Prop[] {
    const propMap = new Map<string, Prop>();
    const defaultMap = this.extractDefaultPropValues(source);

    const interfaceRegex =
      /export\s+interface\s+[A-Za-z_$][A-Za-z0-9_$]*Props[\s\S]*?\{([\s\S]*?)\}/g;
    for (const match of source.matchAll(interfaceRegex)) {
      const body = match[1];
      if (!body) {
        continue;
      }

      this.addPropsFromObjectType(body, propMap, defaultMap);
    }

    const typeAliasRegex = /export\s+type\s+[A-Za-z_$][A-Za-z0-9_$]*Props\s*=\s*\{([\s\S]*?)\}/g;
    for (const match of source.matchAll(typeAliasRegex)) {
      const body = match[1];
      if (!body) {
        continue;
      }

      this.addPropsFromObjectType(body, propMap, defaultMap);
    }

    for (const variant of variants) {
      if (!propMap.has(variant.name)) {
        propMap.set(variant.name, {
          name: variant.name,
          type: "enum",
          values: variant.values,
          required: false,
          defaultValue: variant.defaultValue ? JSON.stringify(variant.defaultValue) : undefined,
          forwarded: false,
        });
      }
    }

    return [...propMap.values()];
  }

  private addPropsFromObjectType(
    body: string,
    propMap: Map<string, Prop>,
    defaults: Map<string, string>,
  ): void {
    const propertyRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\s*(\?)?\s*:\s*([^;\n]+)\s*;?/g;
    for (const propMatch of body.matchAll(propertyRegex)) {
      const name = propMatch[1];
      const optionalMark = propMatch[2];
      const rawType = propMatch[3];
      if (!name || !rawType) {
        continue;
      }

      const normalizedType = rawType.trim();

      const mapped = this.mapType(normalizedType);
      const existing = propMap.get(name);
      const defaultValue = defaults.get(name);

      if (!existing) {
        propMap.set(name, {
          name,
          type: mapped.type,
          values: mapped.values,
          required: optionalMark !== "?",
          defaultValue,
          forwarded: false,
        });
        continue;
      }

      propMap.set(name, {
        ...existing,
        type: existing.type === "unknown" ? mapped.type : existing.type,
        values: existing.values ?? mapped.values,
        required: existing.required && optionalMark !== "?",
        defaultValue: existing.defaultValue ?? defaultValue,
      });
    }
  }

  private extractDefaultPropValues(source: string): Map<string, string> {
    const defaults = new Map<string, string>();
    const destructureRegex = /\(\s*\{([\s\S]*?)\}\s*,\s*ref\s*\)\s*=>/g;

    for (const match of source.matchAll(destructureRegex)) {
      const params = match[1];
      if (!params) {
        continue;
      }

      const defaultRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([^,}\n]+)/g;
      for (const defaultMatch of params.matchAll(defaultRegex)) {
        const name = defaultMatch[1];
        const value = defaultMatch[2];
        if (!name || !value) {
          continue;
        }

        const normalizedValue = value.trim();
        defaults.set(name, normalizedValue);
      }
    }

    return defaults;
  }

  private mapType(rawType: string): { type: Prop["type"]; values?: string[] } {
    const normalized = rawType.replace(/\s+/g, " ").trim();

    const enumValues = this.extractLiteralUnionValues(normalized);
    if (enumValues.length > 0) {
      return { type: "enum", values: enumValues };
    }

    if (normalized.includes("|") || normalized.includes("&")) {
      return { type: "union" };
    }

    if (normalized === "string") return { type: "string" };
    if (normalized === "number") return { type: "number" };
    if (normalized === "boolean") return { type: "boolean" };

    if (normalized.includes("=>")) return { type: "function" };
    if (normalized.endsWith("[]") || normalized.startsWith("Array<")) return { type: "array" };
    if (normalized.startsWith("{") || normalized.startsWith("Record<")) return { type: "object" };
    if (normalized.includes("Ref") || normalized.includes("ElementRef")) return { type: "ref" };

    if (
      normalized.includes("ReactNode") ||
      normalized.includes("JSX.Element") ||
      normalized.includes("TemplateResult") ||
      normalized.includes("VNode")
    ) {
      return { type: "node" };
    }

    return { type: "unknown" };
  }

  private extractLiteralUnionValues(typeSource: string): string[] {
    if (!typeSource.includes("|")) {
      return [];
    }

    const values = [...typeSource.matchAll(/['"]([A-Za-z0-9_-]+)['"]/g)]
      .map((match) => match[1])
      .filter((value): value is string => typeof value === "string");
    return [...new Set(values)];
  }

  private extractObjectKeys(source: string): string[] {
    const keys = [...source.matchAll(/["']?([A-Za-z0-9_-]+)["']?\s*:/g)]
      .map((match) => match[1])
      .filter((value): value is string => typeof value === "string");
    return [...new Set(keys)];
  }

  private parseObjectLikeString(source: string): Map<string, string> {
    const entries = new Map<string, string>();
    const pairRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*["']?([A-Za-z0-9_-]+)["']?/g;

    for (const match of source.matchAll(pairRegex)) {
      const key = match[1];
      const value = match[2];
      if (!key || !value) {
        continue;
      }

      entries.set(key, value);
    }

    return entries;
  }
}
