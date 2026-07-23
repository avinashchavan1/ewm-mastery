/** @type {import('tailwindcss').Config} */
// Colors map to the design system's CSS custom properties (design/design-system.dc.html).
// Toggling [data-theme="dark"] on <html> re-resolves every var — no dark: variants needed.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)',
        surface: 'var(--c-surface)',
        surface2: 'var(--c-surface2)',
        border: 'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        text: 'var(--c-text)',
        text2: 'var(--c-text2)',
        text3: 'var(--c-text3)',
        primary: 'var(--c-primary)',
        'primary-strong': 'var(--c-primary-strong)',
        'primary-tint': 'var(--c-primary-tint)',
        'on-primary': 'var(--c-on-primary)',
        link: 'var(--c-link)',
        ok: 'var(--c-ok)',
        'ok-bg': 'var(--c-ok-bg)',
        'crit-bg': 'var(--c-crit-bg)',
        'crit-text': 'var(--c-crit-text)',
        'high-bg': 'var(--c-high-bg)',
        'high-text': 'var(--c-high-text)',
        'med-bg': 'var(--c-med-bg)',
        'med-text': 'var(--c-med-text)',
        'low-bg': 'var(--c-low-bg)',
        'low-text': 'var(--c-low-text)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      borderRadius: {
        control: '6px',
        card: '10px',
      },
      boxShadow: {
        card: 'var(--c-shadow)',
        overlay: '0 12px 40px rgba(0,0,0,.28)',
      },
      maxWidth: {
        shell: '1120px',
      },
    },
  },
  plugins: [],
};
