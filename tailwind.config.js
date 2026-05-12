/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ESI Level Colors
        esi: {
          1: '#ef4444', // red-500 - Resuscitation
          2: '#f97316', // orange-500 - Emergent
          3: '#facc15', // yellow-400 - Urgent
          4: '#22c55e', // green-500 - Less Urgent
          5: '#3b82f6', // blue-500 - Non-Urgent
        },
        // Primary brand color (teal/cyan for medical feel)
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
    },
  },
  plugins: [],
}
