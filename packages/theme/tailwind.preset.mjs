const modeSafelist = [
  'text-export', 'bg-export', 'bg-export-light', 'bg-export-subtle', 'border-export',
  'hover:bg-export-light', 'hover:bg-export-subtle', 'dark:bg-export/15', 'dark:hover:bg-export/15',
  'text-import', 'bg-import', 'bg-import-light', 'bg-import-subtle', 'border-import',
  'hover:bg-import-light', 'hover:bg-import-subtle', 'dark:bg-import/15', 'dark:hover:bg-import/15'
];

export default {
  darkMode: 'class',
  safelist: modeSafelist,
  theme: {
    extend: {
      colors: {
        export: { DEFAULT: '#1cbd5d', light: '#24dc6d', subtle: '#e4fff3' },
        import: { DEFAULT: '#f08829', light: '#ffa95b', subtle: '#fffcef' }
      }
    }
  }
};
