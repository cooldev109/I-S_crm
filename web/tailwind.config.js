/**
 * Tailwind config — mirrors docs/design-system.md.
 * Warm-neutral base (stone) + blue accent. Status colors exposed as utilities.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF9',
        surface: '#FFFFFF',
        border: '#E7E5E4',
        ink: '#1C1917',
        muted: '#78716C',
        accent: '#2563EB',
        status: {
          pending: '#78716C',
          review: '#D97706',
          ok: '#16A34A',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
