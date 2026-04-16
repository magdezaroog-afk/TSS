// LITC BRANDING - Official Identity System (Mapped to CSS Variables)
export const theme = {
    colors: {
        primary: 'var(--brand-blue)', 
        secondary: 'var(--text-secondary)',
        accent: 'var(--brand-orange)', 
        light: 'var(--glass-border)',        
        bg: 'var(--bg-app)',           
        surface: 'var(--bg-surface)',      
        glass: 'var(--bg-surface)',
        
        text: {
            primary: 'var(--text-primary)',  
            secondary: 'var(--text-secondary)',
            pale: 'var(--text-tertiary)'       
        },
        
        status: {
            success: 'var(--state-success-text)',  
            warning: 'var(--state-warning-text)',  
            error: 'var(--state-danger-text)',    
            info: 'var(--brand-blue)'
        }
    },
    fonts: {
        main: "'Cairo', 'Outfit', sans-serif",
    },
    shadows: {
        soft: 'var(--shadow-card)',
        strong: 'var(--shadow-float)',
        orangeGlow: 'var(--shadow-glow-orange, 0 0 20px rgba(245, 130, 32, 0.3))',
        blueGlow: 'var(--shadow-glow-blue, 0 0 20px rgba(99, 91, 255, 0.3))'
    },
    gradients: {
        main: 'linear-gradient(165deg, var(--brand-blue) 0%, var(--bg-sidebar) 100%)'
    }
};

export const globalStyles = {
    pageWrapper: {
        backgroundColor: 'var(--bg-app)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
        direction: 'rtl',
        fontFamily: theme.fonts.main,
        overflowX: 'hidden',
        transition: 'background-color 0.5s ease, color 0.5s ease'
    },
    card: {
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--glass-border)`,
        boxShadow: 'var(--shadow-card)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }
};
