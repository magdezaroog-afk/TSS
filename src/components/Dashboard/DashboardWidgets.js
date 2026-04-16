import React from 'react';
import { theme } from '../../styles/theme';
import { FaFolderOpen, FaRocket, FaRobot, FaTerminal, FaShieldAlt } from 'react-icons/fa';

// LITC Brand Styled Widgets
const lightWidgetStyle = {
    position: 'relative',
    padding: '25px',
    background: '#ffffff',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '130px',
    border: '1px solid #f1f5f9',
    boxShadow: theme.shadows.soft,
    overflow: 'hidden'
};

const BrandAccent = ({ color }) => (
    <div style={{
        position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: color,
        borderRadius: '2px'
    }}></div>
);

export const ArchiveWidget = ({ count = 0, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                ...lightWidgetStyle,
                '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows.strong }
            }}
        >
            <BrandAccent color={theme.colors.secondary} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '50px', height: '50px', borderRadius: '14px',
                    background: '#f0f9ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    color: theme.colors.secondary
                }}>
                    <FaFolderOpen />
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontWeight: '900', marginBottom: '4px' }}>الأرشيف</div>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '900' }}>سجل الملفات</h3>
                </div>
            </div>

            <div style={{
                position: 'absolute', bottom: '20px', right: '30px',
                fontSize: '36px', fontWeight: '900', color: `${theme.colors.secondary}15`,
                fontFamily: 'monospace'
            }}>
                {count < 10 ? `0${count}` : count}
            </div>
        </div>
    );
};

export const ActiveTicketsWidget = ({ count = 0, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                ...lightWidgetStyle,
                '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows.strong }
            }}
        >
            <BrandAccent color={theme.colors.primary} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '50px', height: '50px', borderRadius: '14px',
                    background: '#fff7ed', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    color: theme.colors.primary
                }}>
                    <FaTerminal />
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontWeight: '900', marginBottom: '4px' }}>العمليات القائمة</div>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '900' }}>الإشارات النشطة</h3>
                </div>
            </div>

            <div style={{
                position: 'absolute', bottom: '20px', right: '30px',
                fontSize: '36px', fontWeight: '900', color: `${theme.colors.primary}15`,
                fontFamily: 'monospace'
            }}>
                {count < 10 ? `0${count}` : count}
            </div>
        </div>
    );
};

export const SelfHelpWidget = ({ onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                ...lightWidgetStyle,
                '&:hover': { transform: 'translateY(-5px)', boxShadow: theme.shadows.strong }
            }}
        >
            <BrandAccent color={theme.colors.accentBlue} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '50px', height: '50px', borderRadius: '14px',
                    background: '#f0f7ff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '22px',
                    color: theme.colors.accentBlue
                }}>
                    <FaRobot />
                </div>
                <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontWeight: '900', marginBottom: '4px' }}>الذكاء الاصطناعي</div>
                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '20px', fontWeight: '900' }}>المساعدة الذكية</h3>
                </div>
            </div>

            <div style={{
                position: 'absolute', bottom: '15px', right: '20px',
                fontSize: '9px', fontWeight: '900', color: theme.colors.accentBlue,
                letterSpacing: '1px', opacity: 0.4
            }}>
                V4_READY
            </div>
        </div>
    );
};

