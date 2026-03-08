/** @type {import('@storybook/html-vite').StorybookConfig} */
module.exports = {
  framework: "@storybook/html-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
  },
};
