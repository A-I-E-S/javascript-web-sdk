const modeSafelist = [
  'text-export', 'bg-export', 'bg-export-subtle', 'bg-export-light', 'border-export',
  'hover:bg-export-light', 'hover:bg-export-subtle', 'dark:bg-export/15', 'dark:hover:bg-export/15',
  'dark:bg-[color-mix(in_srgb,#1cbd5d_15%,#212529)]',
  'text-import', 'bg-import', 'bg-import-subtle', 'bg-import-light', 'border-import',
  'hover:bg-import-light', 'hover:bg-import-subtle', 'dark:bg-import/15', 'dark:hover:bg-import/15',
  'dark:bg-[color-mix(in_srgb,#f08829_15%,#212529)]'
];

function africaniesInteractiveCursorPlugin({ addBase }) {
  addBase({
    [[
      'a[href]',
      'button:not(:disabled):not([aria-disabled="true"])',
      'summary',
      'label[for]',
      'select:not(:disabled)',
      'input[type="button"]:not(:disabled)',
      'input[type="submit"]:not(:disabled)',
      'input[type="reset"]:not(:disabled)',
      'input[type="checkbox"]:not(:disabled)',
      'input[type="radio"]:not(:disabled)',
      'input[type="file"]:not(:disabled)',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])',
      '[role="menuitem"]:not([aria-disabled="true"])',
      '[role="option"]:not([aria-disabled="true"])',
      '[role="tab"]:not([aria-disabled="true"])',
      '[role="checkbox"]:not([aria-disabled="true"])',
      '[role="radio"]:not([aria-disabled="true"])',
      '[role="switch"]:not([aria-disabled="true"])'
    ].join(', ')]: { cursor: 'pointer' },
    ':disabled, [aria-disabled="true"]': { cursor: 'not-allowed' }
  });
}

function africaniesAutofillPlugin({ addBase }) {
  const autofillSelectors = [
    'input:-webkit-autofill',
    'input:-webkit-autofill:hover',
    'input:-webkit-autofill:focus',
    'input:-webkit-autofill:active',
    'textarea:-webkit-autofill',
    'textarea:-webkit-autofill:hover',
    'textarea:-webkit-autofill:focus',
    'textarea:-webkit-autofill:active'
  ];
  const rules = {};
  for (const selector of autofillSelectors) {
    rules[selector] = {
      WebkitTextFillColor: '#212529',
      caretColor: '#212529',
      boxShadow: '0 0 0 1000px #ffffff inset',
      transition: 'background-color 99999s ease-in-out 0s'
    };
    rules[`.dark ${selector}`] = {
      WebkitTextFillColor: '#ffffff',
      caretColor: '#ffffff',
      boxShadow: '0 0 0 1000px #272729 inset'
    };
  }
  addBase(rules);
}

function africaniesSpinPlugin({ addBase }) {
  addBase({
    '@keyframes africanies-spin': { to: { transform: 'rotate(360deg)' } },
    '.animate-spin': { animation: 'africanies-spin 1s linear infinite' }
  });
}

function africaniesOverlayStackPlugin({ addBase }) {
  addBase({
    '.cdk-global-overlay-wrapper.africanies-toast-overlay, .cdk-overlay-pane.africanies-toast-panel': {
      zIndex: '1100'
    }
  });
}

function africaniesOverlayScrollPlugin({ addBase }) {
  addBase({
    '.africanies-modal-panel, .africanies-drawer-panel': {
      overflow: 'hidden',
      overscrollBehavior: 'contain'
    },
    '.africanies-modal-panel > *, .africanies-drawer-panel > *': {
      minHeight: 0,
      overflowX: 'hidden',
      overflowY: 'auto',
      overscrollBehavior: 'contain',
      scrollbarGutter: 'stable'
    },
    '.africanies-drawer-panel > *': { height: '100%' },
    '.africanies-overlay-scroll': {
      overscrollBehavior: 'contain',
      scrollbarGutter: 'stable'
    }
  });
}

export default {
  darkMode: 'class',
  safelist: modeSafelist,
  plugins: [
    africaniesInteractiveCursorPlugin,
    africaniesSpinPlugin,
    africaniesOverlayStackPlugin,
    africaniesOverlayScrollPlugin,
    africaniesAutofillPlugin
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
        ink: {
          DEFAULT: '#212529',
          blue: '#192a3e',
          brand: '#1c2b3f',
          950: '#272729'
        },
        neutral: {
          50: '#f7f9fc',
          100: '#eef2f7',
          200: '#dfe6ee',
          300: '#c9d5e1',
          400: '#a9b5cb',
          500: '#8593a8',
          600: '#667185',
          700: '#4d586b',
          800: '#3a4557',
          900: '#252d3a'
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f7f9fc',
          sunken: '#eef2f7'
        },
        border: {
          subtle: '#e4eaf1',
          DEFAULT: '#c9d5e1',
          strong: '#a9b5cb'
        },
        background: {
          welcome: '#f1f5f9'
        },
        export: {
          DEFAULT: '#1cbd5d',
          light: '#24dc6d',
          ink: '#0b7a3d',
          subtle: '#e6f6ed',
          tint: '#f2fff8'
        },
        import: {
          DEFAULT: '#f08829',
          light: '#ffa95b',
          ink: '#9a5410',
          subtle: '#fdf3e8'
        },
        danger: {
          DEFAULT: '#ff001c',
          dark: '#b41433',
          strong: '#c00b19',
          ink: '#b3121f',
          subtle: '#fdecec'
        },
        warning: {
          DEFAULT: '#dbb316',
          dark: '#ef8833',
          ink: '#8a6d0b',
          subtle: '#fdf3d9'
        }
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)',
        raised: '0 4px 8px -2px rgb(16 24 40 / 0.08), 0 2px 4px -2px rgb(16 24 40 / 0.04)',
        overlay: '0 12px 24px -6px rgb(16 24 40 / 0.12), 0 4px 8px -4px rgb(16 24 40 / 0.06)'
      },
      fontFamily: {
        sans: ['Arial', 'sans-serif']
      },
      fontSize: {
        'heading-1': ['2.5rem', { lineHeight: 1.2, fontWeight: 700 }],
        'heading-2': ['2rem', { lineHeight: 1.25, fontWeight: 700 }],
        'heading-3': ['1.5rem', { lineHeight: 1.3, fontWeight: 600 }],
        'body-lg': ['1.125rem', { lineHeight: 1.5, fontWeight: 400 }],
        body: ['1rem', { lineHeight: 1.5, fontWeight: 400 }],
        'body-sm': ['0.875rem', { lineHeight: 1.4, fontWeight: 400 }],
        caption: ['0.75rem', { lineHeight: 1.3, fontWeight: 400 }]
      }
    }
  }
};
