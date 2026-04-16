import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'التبديل للوضع الداكن' : 'التبديل للوضع الفاتح'}
            style={{
                position: 'fixed',
                top: '30px',
                left: '30px',
                zIndex: 9999,
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'var(--glass-blur)',
                boxShadow: 'var(--shadow-card)',
                color: 'var(--brand-orange)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
            }}
        >
            {theme === 'light' ? <Moon size={24} color="#005C84" /> : <Sun size={24} color="#F58220" />}
        </button>
    );
};

export default ThemeToggle;
