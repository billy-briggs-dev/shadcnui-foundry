import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  framework: "@storybook/vue3-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    builder: "@storybook/builder-vite",
    disableTelemetry: true,
  },
};

export default config;
