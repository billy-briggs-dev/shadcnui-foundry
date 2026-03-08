import * as React from "react";
import buttonSource from "@generated/react/button/Button.tsx?raw";
import cardSource from "@generated/react/card/Card.tsx?raw";
import inputSource from "@generated/react/input/Input.tsx?raw";
import type { Meta, StoryObj } from "@storybook/react";

type ShellStoryArgs = {
  title: string;
  description: string;
  source: string;
};

function ShellStory(args: ShellStoryArgs) {
  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: "960px",
        fontFamily: "Inter, Segoe UI, system-ui, sans-serif",
        padding: "2rem 1rem 3rem",
      }}
    >
      <h1 style={{ marginTop: 0 }}>{args.title}</h1>
      <p style={{ color: "#4b5563", lineHeight: 1.6 }}>{args.description}</p>

      <section
        style={{
          border: "1px dashed #94a3b8",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        <button
          style={{
            border: 0,
            borderRadius: "8px",
            background: "#2563eb",
            color: "white",
            padding: "0.5rem 0.9rem",
          }}
          type="button"
        >
          Button
        </button>
        <div style={{ height: "0.75rem" }} />
        <input
          placeholder="Type here"
          style={{
            border: "1px solid #94a3b8",
            borderRadius: "8px",
            maxWidth: "260px",
            padding: "0.45rem 0.6rem",
            width: "100%",
          }}
        />
      </section>

      <pre
        style={{
          background: "#0b1330",
          borderRadius: "8px",
          color: "#e6ebff",
          margin: 0,
          maxHeight: "340px",
          overflow: "auto",
          padding: "0.8rem",
        }}
      >
        <code>{args.source}</code>
      </pre>
    </main>
  );
}

const meta = {
  title: "Generated/React",
  component: ShellStory,
  parameters: {
    docs: {
      description: {
        component:
          "Preview generated React outputs in Storybook while keeping source snippets visible for quick inspection.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ShellStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    title: "React Button",
    description: "Generated shell preview and source for Button.",
    source: buttonSource,
  },
};

export const Input: Story = {
  args: {
    title: "React Input",
    description: "Generated shell preview and source for Input.",
    source: inputSource,
  },
};

export const Card: Story = {
  args: {
    title: "React Card",
    description: "Generated shell preview and source for Card.",
    source: cardSource,
  },
};
