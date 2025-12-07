import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'jeju-light': {
          primary: '#FF8A00',
          'primary-variant': '#FF6A00',
          secondary: '#4CAF50',
          'secondary-variant': '#6CCF70',
          background: '#FFFDF9',
          surface: '#FFFFFF',
          divider: '#E5E5E5',
          'text-primary': '#1A1A1A',
          'text-secondary': '#555555',
          'text-disabled': '#9E9E9E',
          error: '#E53935',
          success: '#43A047',
          info: '#0288D1',
        },
        'jeju-dark': {
          primary: '#FF9100',
          'primary-variant': '#FF7800',
          secondary: '#66BB6A',
          'secondary-variant': '#8EE58F',
          background: '#121212',
          surface: '#1E1E1E',
          'elevated-surface': '#2A2A2A',
          divider: '#333333',
          'text-primary': '#FFFFFF',
          'text-secondary': '#CCCCCC',
          'text-disabled': '#777777',
          error: '#EF5350',
          success: '#66BB6A',
          info: '#29B6F6',
        },
        // Legacy colors to prevent breaking existing code temporarily
        ormi: {
          green: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
          },
          ember: {
            50: '#fff7ed',
            100: '#ffedd5',
            500: '#f97316',
            600: '#ea580c',
          },
          pink: {
            100: '#fce7f3',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
