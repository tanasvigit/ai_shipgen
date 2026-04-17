/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f7f9fb',
        surface: '#f7f9fb',
        'surface-container-low': '#f2f4f6',
        'surface-container-lowest': '#ffffff',
        'surface-container-high': '#e6e8ea',
        'surface-container-highest': '#e0e3e5',
        'surface-container': '#eceef0',
        primary: '#000000',
        'on-primary': '#ffffff',
        'on-surface': '#191c1e',
        'on-surface-variant': '#45464d',
        'on-primary-container': '#188ace',
        'on-tertiary-container': '#009668',
        'tertiary-fixed': '#6ffbbe',
        'outline-variant': '#c6c6cd',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15,23,42,0.06)',
      },
    },
  },
  plugins: [],
}

