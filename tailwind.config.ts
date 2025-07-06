import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  prefix: "",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        festival: {
          // couleurs du 1er fichier
          blue: '#1e40af',
          'blue-light': '#3b82f6',
          'blue-dark': '#1e3a8a',
          success: '#16a34a',
          'success-light': '#22c55e',
          danger: '#dc2626',
          'danger-light': '#ef4444',
          gray: '#6b7280',
          'gray-light': '#9ca3af',
          // couleurs du 2e fichier
          primary: '#8B5CF6',
          'primary-dark': '#7C3AED',
          'primary-light': '#A78BFA',
          secondary: '#06B6D4',
          'secondary-dark': '#0891B2',
          'secondary-light': '#67E8F9',
          accent: '#F59E0B',
          'accent-dark': '#D97706',
          'accent-light': '#FCD34D',
          'success-dark': '#059669', 
          'danger-dark': '#DC2626',
          'dark': '#1F2937',
          'dark-light': '#374151',
          'dark-lighter': '#4B5563',
          light: '#F9FAFB',
          'light-dark': '#F3F4F6',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'scan-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' }
        },
        'gradient-shift': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' }
        },
        'glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
          },
          '50%': {
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scan-pulse': 'scan-pulse 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      backgroundImage: {
        'gradient-festival': 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
        'gradient-festival-dark': 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    }
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;