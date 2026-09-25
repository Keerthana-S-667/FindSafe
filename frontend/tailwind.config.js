/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FAF4EF',
          100: '#F2E4D8',
          200: '#E4C6B2',
          300: '#D1A384',
          400: '#B87B53',
          500: '#A64F19', // Primary Rich Terracotta Earthy Brown
          600: '#8C3E11',
          700: '#6F2E0A',
          800: '#562206',
          900: '#421A04',
          950: '#2B1002',
        },
        surface: {
          50: '#FFFDF9',  // Pure Light Ivory Base Background
          100: '#FAF5EE', // Warm Cream Page Background
          200: '#F4ECE2', // Light Warm Sand Container / Card Background
          300: '#EAE1D5', // Khaki Hover / Elevated Light Surface
          400: '#D8CCBD', // Khaki Divider / Border
          500: '#BDB09E', // Earthy Border Accent
          600: '#8C664D', // Muted Earthy Brown for captions / labels
          700: '#754E36', // Medium Earthy Brown for secondary text
          800: '#5E3A24', // Warm Earthy Brown for body text
          900: '#4D2D1B', // Deep Warm Brown for titles
          950: '#3D2213', // Darkest Warm Timber for primary headings
        },
        status: {
          success: '#2D6A4F',
          'success-bg': '#EAF5EF',
          warning: '#AC5D13',
          'warning-bg': '#FAF0E6',
          danger: '#A42A2A',
          'danger-bg': '#FDF2F2',
          info: '#235773',
          'info-bg': '#EEF6FC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
}

