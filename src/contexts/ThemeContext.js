import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('litc_tss_theme');
        if (savedTheme) return savedTheme;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        // Automatically inject data-theme on to the root document html tag
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('litc_tss_theme', theme);
        
        // Setup transition helper to avoid initial flashing styles
        document.documentElement.classList.add('theme-transitioning');
        const timeout = setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 500); // Wait for CSS transitions
        return () => clearTimeout(timeout);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
