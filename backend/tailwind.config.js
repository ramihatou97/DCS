/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        medical: {
          emergency: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        'medical-title': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'medical-body': ['1rem', { lineHeight: '1.75rem', fontWeight: '400' }],
        'medical-small': ['0.875rem', { lineHeight: '1.5rem', fontWeight: '400' }],
      },
      spacing: {
        'medical-section': '1.5rem',
        'medical-gap': '1rem',
      },
      borderRadius: {
        'medical': '0.5rem',
      },
      boxShadow: {
        'medical': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medical-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}
