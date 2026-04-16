import React from 'react';
import { theme } from '../../styles/theme';
import { FaRocket, FaSatellite, FaTerminal, FaCheckDouble } from 'react-icons/fa';

const TicketRoadmap = ({ ticket, mini = false }) => {
    // Professional Stages for the LITC Corporate theme
    const stages = [
        { key: 'created', label: 'SUBMISSION / تقديم البلاغ', icon: <FaRocket />, role: 'الموظف' },
        { key: 'assigned', label: 'ASSIGNMENT / إسناد المهمة', icon: <FaSatellite />, role: 'مدير النظام' },
        { key: 'processing', label: 'TREATMENT / معالجة فنية', icon: <FaTerminal />, role: 'المهندس' },
        { key: 'completed', label: 'RESOLUTION / إغلاق البلاغ', icon: <FaCheckDouble />, role: 'النظام' }
    ];

    const getStatusIndex = () => {
        if (ticket.status === 'مكتمل' || ticket.status === 'Closed') return 3;
        if (ticket.status === 'جاري العمل' || ticket.status === 'In Progress') return 2;
        if (ticket.assignedTo) return 1;
        return 0;
    };

    const currentIndex = getStatusIndex();

    if (mini) {
        return (
            <div style={styles.miniContainer}>
                {stages.map((step, index) => (
                    <div key={step.key} style={styles.miniStepWrapper}>
                        <div style={{
                            ...styles.miniDot,
                            background: index <= currentIndex ? theme.colors.primary : theme.colors.light,
                            boxShadow: index === currentIndex ? `0 0 10px ${theme.colors.primary}44` : 'none',
                        }}></div>
                        {index < stages.length - 1 && (
                            <div style={{
                                ...styles.miniLine,
                                background: index < currentIndex ? theme.colors.primary : theme.colors.light
                            }}></div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={styles.largeContainer}>
            <div style={styles.roadmapLine}></div>
            {stages.map((step, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = index === currentIndex;

                return (
                    <div key={step.key} style={styles.stepItem}>
                        <div style={{
                            ...styles.iconWrapper,
                            background: isActive ? `${theme.colors.primary}15` : '#fff',
                            borderColor: isActive ? theme.colors.primary : theme.colors.light,
                            color: isActive ? theme.colors.primary : theme.colors.text.pale,
                            boxShadow: isCurrent ? theme.shadows.soft : 'none'
                        }}>
                            {isActive && index < currentIndex ? <FaCheckDouble /> : step.icon}
                        </div>
                        <div style={styles.stepInfo}>
                            <h4 style={{ ...styles.stepLabel, color: isActive ? theme.colors.secondary : theme.colors.text.pale }}>
                                {step.label}
                                {isCurrent && <span style={styles.liveTag}>[ نشط ]</span>}
                            </h4>
                            <p style={styles.stepRole}>{step.role}</p>
                            {isActive && (
                                <p style={styles.stepTime}>
                                    {index === 0 ? 'تم التسجيل' : 'تمت المزامنة'}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const styles = {
    miniContainer: { display: 'flex', alignItems: 'center', gap: '2px', marginTop: '12px' },
    miniStepWrapper: { display: 'flex', alignItems: 'center' },
    miniDot: { width: '8px', height: '8px', borderRadius: '50%', transition: '0.4s' },
    miniLine: { width: '22px', height: '2px', transition: '0.4s' },
    largeContainer: { position: 'relative', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '35px' },
    roadmapLine: { position: 'absolute', top: '20px', bottom: '20px', right: '28px', width: '2px', background: theme.colors.light, zIndex: 1 },
    stepItem: { display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', gap: '30px', position: 'relative', zIndex: 2 },
    iconWrapper: {
        width: '56px', height: '56px', borderRadius: '18px', border: '1px solid',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', transition: '0.5s'
    },
    stepInfo: { textAlign: 'right', flex: 1 },
    stepLabel: { margin: '0 0 5px 0', fontSize: '14px', fontWeight: '900', letterSpacing: '0.5px' },
    liveTag: { fontSize: '10px', color: theme.colors.status.success, marginLeft: '10px', fontWeight: 'bold' },
    stepRole: { margin: 0, fontSize: '11px', color: theme.colors.text.secondary, fontWeight: '700' },
    stepTime: { margin: '6px 0 0 0', fontSize: '10px', color: theme.colors.primary, fontWeight: '900' }
};


export default TicketRoadmap;
