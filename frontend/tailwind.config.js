export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#2563eb',
        secondary: '#0f766e',
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        'compliance-safe': '#16a34a',
        'compliance-warning': '#d97706',
        'compliance-critical': '#dc2626'
      }
    }
  },
  plugins: [
    '@tailwindcss/forms'
  ],
  corePlugins: {
    preflight: false, // Prevents Tailwind from processing external styles
  }
};
