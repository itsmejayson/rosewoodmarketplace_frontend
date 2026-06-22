/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Rose pink — dynamically themed via --rw-h / --rw-s CSS variables
        rosewood: {
          50:  'hsl(var(--rw-h) var(--rw-s) 97%)',
          100: 'hsl(var(--rw-h) var(--rw-s) 94%)',
          200: 'hsl(var(--rw-h) var(--rw-s) 87%)',
          300: 'hsl(var(--rw-h) var(--rw-s) 77%)',
          400: 'hsl(var(--rw-h) var(--rw-s) 67%)',
          500: 'hsl(var(--rw-h) var(--rw-s) 59%)',
          600: 'hsl(var(--rw-h) var(--rw-s) 50%)',
          700: 'hsl(var(--rw-h) var(--rw-s) 40%)',
          800: 'hsl(var(--rw-h) var(--rw-s) 32%)',
          900: 'hsl(var(--rw-h) var(--rw-s) 24%)',
          950: 'hsl(var(--rw-h) var(--rw-s) 14%)',
        },
        // Warm dark brown — from the "Rosewood" script lettering
        wood: {
          50:  '#F8F4F1',
          100: '#EEE5DC',
          200: '#DCCBB9',
          300: '#C4A98F',
          400: '#AB8669',
          500: '#8B6550',
          600: '#70503E',
          700: '#5C4133', // logo script color
          800: '#4A3328',
          900: '#3A2820',
          950: '#231810',
        },
        // Leaf green — from the leaf accent in the logo
        leaf: {
          50:  '#F3FAE8',
          100: '#E4F4CC',
          200: '#CBE99F',
          300: '#AAD96A',
          400: '#90C944',
          500: '#78B832', // logo leaf green
          600: '#5E9426',
          700: '#48731E',
          800: '#3A5B1A',
          900: '#2F4B17',
          950: '#17280A',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: 0 }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: 0 } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
