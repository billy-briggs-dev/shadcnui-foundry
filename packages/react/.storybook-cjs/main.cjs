/** @type {import('@storybook/react-vite').StorybookConfig} */
module.exports = {
  framework: "@storybook/react-vite",
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  addons: [],
  core: {
    disableTelemetry: true,
  },
};
