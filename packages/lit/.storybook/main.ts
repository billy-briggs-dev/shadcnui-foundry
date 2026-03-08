import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  framework: "@storybook/web-components-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    builder: "@storybook/builder-vite",
    disableTelemetry: true,
  },
};

export default config;
