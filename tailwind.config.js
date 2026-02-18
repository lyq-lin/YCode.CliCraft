/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,tsx,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a7c42',
          hover: '#096b39',
          light: '#e8f5ee',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f5f5f5',
        },
        text: {
          primary: '#0f172a',
          secondary: '#475569',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        card-hover: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
