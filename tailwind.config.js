/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            screens: {
                '3xl': '1920px',
            },
            colors: {
                brand: {
                    50:  '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563EB',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8f',
                    950: '#172554',
                },
                primary: {
                    50:  '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563EB',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8f',
                    950: '#172554',
                },
                gray: {
                    50:  '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    dark:    '#0f172a',
                },
                'dark-bg': {
                    primary:   '#060816',
                    secondary: '#0B1023',
                    tertiary:  '#10182B',
                    card:      '#121A2F',
                },
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-brand':    'linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%)',
                'gradient-azure':    'linear-gradient(135deg, #0078D4 0%, #005a9e 100%)',
                'gradient-aws':      'linear-gradient(135deg, #FF9900 0%, #e07b00 100%)',
                'gradient-dark':     'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                'gradient-card':     'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                'gradient-radial':   'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
            },
            boxShadow: {
                'brand':      '0 4px 24px rgba(37,99,235,0.25)',
                'brand-lg':   '0 8px 40px rgba(37,99,235,0.30)',
                'glow-brand': '0 0 20px rgba(37,99,235,0.4)',
                'azure':    '0 4px 24px rgba(0,120,212,0.25)',
                'aws':      '0 4px 24px rgba(255,153,0,0.25)',
                'card':     '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                'card-lg':  '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.08)',
                'glass':    '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
                'glow-azure': '0 0 20px rgba(0,120,212,0.4)',
                'glow-aws':   '0 0 20px rgba(255,153,0,0.4)',
            },
            animation: {
                'fade-in':      'fadeIn 0.4s ease-out forwards',
                'slide-up':     'slideUp 0.4s ease-out forwards',
                'slide-in-left':'slideInLeft 0.3s ease-out forwards',
                'scale-in':     'scaleIn 0.3s ease-out forwards',
                'shimmer':      'shimmer 1.8s infinite linear',
                'float':        'float 3s ease-in-out infinite',
                'count-up':     'countUp 0.6s ease-out forwards',
                'pulse-soft':   'pulseSoft 2s ease-in-out infinite',
                'spin-slow':    'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to:   { opacity: '1' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(16px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    from: { opacity: '0', transform: 'translateX(-16px)' },
                    to:   { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to:   { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%':   { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition:  '200% 0' },
                },
                float: {
                    '0%,100%': { transform: 'translateY(0)' },
                    '50%':     { transform: 'translateY(-6px)' },
                },
                pulseSoft: {
                    '0%,100%': { opacity: '1' },
                    '50%':     { opacity: '0.6' },
                },
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            },
            backdropBlur: {
                xs: '2px',
            },
            transitionDuration: {
                '400': '400ms',
            },
        },
    },
    plugins: [],
}
