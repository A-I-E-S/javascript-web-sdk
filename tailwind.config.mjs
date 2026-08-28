import africanThisTheme from './packages/theme/tailwind.preset.mjs';

export default {
  presets: [africanThisTheme],
  content: [
    './examples/playground/**/*.{html,js,mjs}',
    './packages/ui/src/**/*.{js,ts}'
  ]
};
