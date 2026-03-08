/** @type {import('@storybook/web-components-vite').StorybookConfig} */
module.exports = {
  framework: "@storybook/web-components-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
  },
};
