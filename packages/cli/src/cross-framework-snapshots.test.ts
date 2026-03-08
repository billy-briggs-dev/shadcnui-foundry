import { AngularEmitter, AngularTransformer } from "@shadcnui-foundry/angular";
import type {
  ComponentIR,
  FrameworkTarget,
  GeneratedFile,
  PipelineResult,
} from "@shadcnui-foundry/ir";
import { LitEmitter, LitTransformer } from "@shadcnui-foundry/lit";
import { ReactEmitter, ReactTransformer } from "@shadcnui-foundry/react";
import { SvelteEmitter, SvelteTransformer } from "@shadcnui-foundry/svelte";
import { VueEmitter, VueTransformer } from "@shadcnui-foundry/vue";
import { describe, expect, it } from "vitest";

type TransformerLike = {
  transform(ir: ComponentIR): Promise<
    PipelineResult<{
      componentId: string;
      framework: FrameworkTarget;
      spec: Record<string, unknown>;
    }>
  >;
};

type EmitterLike = {
  emit(transformed: {
    componentId: string;
    framework: FrameworkTarget;
    spec: Record<string, unknown>;
  }): Promise<PipelineResult<GeneratedFile[]>>;
};

function expectSuccess<T>(result: PipelineResult<T>): T {
  if (!result.success) {
    throw new Error(result.errors.map((error) => `[${error.code}] ${error.message}`).join(", "));
  }

  return result.data;
}

function createComponentIR(input: {
  id: string;
  name: string;
  description: string;
  category: ComponentIR["category"];
  roles: string[];
  props: ComponentIR["props"];
  variants: ComponentIR["variants"];
}): ComponentIR {
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    category: input.category,
    props: input.props,
    variants: input.variants,
    a11y: {
      roles: input.roles,
      requiredAttributes: [],
      optionalAttributes: input.roles.length > 0 ? ["aria-disabled"] : [],
      keyboardInteractions: [],
      focusManagement: "none",
      liveRegion: false,
      wcagCriteria: [],
    },
    dependencies: [],
    tags: [],
    provenance: {
      registry: "test",
      registryName: input.id,
      fetchedAt: "2026-03-07T00:00:00.000Z",
    },
    generatedAt: "2026-03-07T00:00:00.000Z",
    irVersion: "1.0.0",
  };
}

async function generateAcrossFrameworks(
  ir: ComponentIR,
): Promise<Array<{ framework: FrameworkTarget; files: Array<{ path: string; content: string }> }>> {
  const matrix: Array<{
    framework: FrameworkTarget;
    transformer: TransformerLike;
    emitter: EmitterLike;
  }> = [
    {
      framework: "react",
      transformer: new ReactTransformer(),
      emitter: new ReactEmitter(),
    },
    {
      framework: "vue",
      transformer: new VueTransformer(),
      emitter: new VueEmitter(),
    },
    {
      framework: "svelte",
      transformer: new SvelteTransformer(),
      emitter: new SvelteEmitter(),
    },
    {
      framework: "angular",
      transformer: new AngularTransformer(),
      emitter: new AngularEmitter(),
    },
    {
      framework: "lit",
      transformer: new LitTransformer(),
      emitter: new LitEmitter(),
    },
  ];

  const output: Array<{
    framework: FrameworkTarget;
    files: Array<{ path: string; content: string }>;
  }> = [];

  for (const target of matrix) {
    const transformed = expectSuccess(await target.transformer.transform(ir));
    const emitted = expectSuccess(await target.emitter.emit(transformed));

    output.push({
      framework: target.framework,
      files: emitted.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    });
  }

  return output;
}

describe("cross-framework snapshots", () => {
  it("generates stable snapshots for Button", async () => {
    const ir = createComponentIR({
      id: "button",
      name: "Button",
      description: "A clickable button component",
      category: "primitive",
      roles: ["button"],
      props: [
        {
          name: "disabled",
          type: "boolean",
          required: false,
          defaultValue: "false",
          forwarded: true,
        },
      ],
      variants: [
        {
          name: "variant",
          values: ["default", "outline"],
          defaultValue: "default",
          strategy: "class",
        },
        {
          name: "size",
          values: ["default", "sm", "lg"],
          defaultValue: "default",
          strategy: "class",
        },
      ],
    });

    const output = await generateAcrossFrameworks(ir);
    expect(output).toMatchSnapshot();
  });

  it("generates stable snapshots for Input", async () => {
    const ir = createComponentIR({
      id: "input",
      name: "Input",
      description: "A text input component",
      category: "form",
      roles: ["textbox"],
      props: [
        {
          name: "placeholder",
          type: "string",
          required: false,
          defaultValue: '""',
          forwarded: true,
        },
        {
          name: "disabled",
          type: "boolean",
          required: false,
          defaultValue: "false",
          forwarded: true,
        },
      ],
      variants: [],
    });

    const output = await generateAcrossFrameworks(ir);
    expect(output).toMatchSnapshot();
  });

  it("generates stable snapshots for Card", async () => {
    const ir = createComponentIR({
      id: "card",
      name: "Card",
      description: "A layout container component",
      category: "layout",
      roles: [],
      props: [
        {
          name: "elevated",
          type: "boolean",
          required: false,
          defaultValue: "false",
          forwarded: false,
        },
      ],
      variants: [
        {
          name: "tone",
          values: ["default", "muted"],
          defaultValue: "default",
          strategy: "class",
        },
      ],
    });

    const output = await generateAcrossFrameworks(ir);
    expect(output).toMatchSnapshot();
  });

  it("generates stable snapshots for Dialog", async () => {
    const ir = createComponentIR({
      id: "dialog",
      name: "Dialog",
      description: "An overlay dialog component",
      category: "overlay",
      roles: ["dialog"],
      props: [
        {
          name: "open",
          type: "boolean",
          required: false,
          defaultValue: "false",
          forwarded: false,
        },
      ],
      variants: [
        {
          name: "size",
          values: ["sm", "md", "lg"],
          defaultValue: "md",
          strategy: "class",
        },
      ],
    });

    const output = await generateAcrossFrameworks(ir);
    expect(output).toMatchSnapshot();
  });

  it("generates stable snapshots for NavigationMenu edge-case props", async () => {
    const ir = createComponentIR({
      id: "navigation-menu",
      name: "NavigationMenu",
      description: "A composite navigation menu component",
      category: "navigation",
      roles: ["navigation"],
      props: [
        {
          name: "aria-label",
          type: "string",
          required: false,
          defaultValue: '"Main Navigation"',
          forwarded: true,
        },
        {
          name: "data-state",
          type: "string",
          required: false,
          defaultValue: '"closed"',
          forwarded: true,
        },
      ],
      variants: [
        {
          name: "orientation",
          values: ["horizontal", "vertical"],
          defaultValue: "horizontal",
          strategy: "class",
        },
      ],
    });

    const output = await generateAcrossFrameworks(ir);
    expect(output).toMatchSnapshot();
  });
});
