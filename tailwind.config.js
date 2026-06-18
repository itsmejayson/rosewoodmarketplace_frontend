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
        // Rose pink — from the rose flower in the Rosewood Place logo
        rosewood: {
          50:  '#FDF2F6',
          100: '#FBDDE8',
          200: '#F6BBD1',
          300: '#EE8CB1',
          400: '#E45D8F',
          500: '#D84B7A',
          600: '#C84B6E', // primary brand — logo rose
          700: '#A63459',
          800: '#8A2C4A',
          900: '#6B2039',
          950: '#3D1122',
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
