import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    builder: "@storybook/builder-vite",
    disableTelemetry: true,
  },
};

export default config;
