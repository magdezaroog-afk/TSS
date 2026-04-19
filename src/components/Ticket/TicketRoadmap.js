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
        if (ticket.status === 'مكتمل' || ticket.status === 'Closed') return 4;
        if (ticket.status === 'جاري العمل' || ticket.status === 'In Progress') return 3;
        if (ticket.isTransferPending) return 2.5; // Special state for transfer
        if (ticket.assignedTo) return 2;
        return 1;
    };

    const currentIndex = getStatusIndex();

    const stages = [
        { key: 1, label: 'فتح البلاغ / OPENED', sub: `بواسطة: ${ticket.userName || 'الموظف'} - موقع ${ticket.building || 'LITC'}`, icon: <FaRocket /> },
        { key: 2, label: 'الاستلام / RECEIVED', sub: ticket.assignedTo ? `مستلم بواسطة: ${ticket.assignedTo.split('@')[0]}` : 'بانتظار استجابة فريق الدعم', icon: <FaSatellite /> },
        { key: 3, label: 'المعالجة / PROCESSING', sub: ticket.status === 'جاري العمل' ? 'يتم العمل حالياً على طلبك' : (ticket.status === 'مكتمل' ? 'تمت المعالجة بنجاح' : 'بانتظار البدء في الفحص'), icon: <FaTerminal /> },
        { key: 4, label: 'الإغلاق / CLOSED', sub: ticket.status === 'مكتمل' ? 'تم حل المشكلة وتوثيق الإجراء' : 'البلاغ لا يزال مفتوحاً', icon: <FaCheckDouble /> }
    ];

    return (
        <div style={styles.largeContainer}>
            <div style={styles.roadmapLine}></div>
            {stages.map((step, index) => {
                const stepNum = index + 1;
                const isActive = stepNum <= currentIndex;
                const isCurrent = Math.floor(currentIndex) === stepNum;

                return (
                    <div key={step.key} style={styles.stepItem}>
                        <div style={{
                            ...styles.iconWrapper,
                            background: isActive ? `${theme.colors.primary}15` : 'var(--bg-app)',
                            borderColor: isActive ? theme.colors.primary : 'var(--glass-border)',
                            color: isActive ? theme.colors.primary : 'var(--text-tertiary)',
                            boxShadow: isCurrent ? theme.shadows.soft : 'none'
                        }}>
                            {isActive && stepNum < Math.floor(currentIndex) ? <FaCheckDouble /> : step.icon}
                        </div>
                        <div style={styles.stepInfo}>
                            <h4 style={{ ...styles.stepLabel, color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                                {step.label}
                                {isCurrent && <span style={styles.liveTag}>[ نشط حالياً ]</span>}
                            </h4>
                            <p style={styles.stepSub}>{step.sub}</p>
                            {ticket.isTransferPending && stepNum === 2 && (
                                <div style={styles.transferAlert}>جاري تحويل التذكرة إلى: {ticket.transferTo?.split('@')[0]}</div>
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
    stepLabel: { margin: '0 0 5px 0', fontSize: '13px', fontWeight: '900', letterSpacing: '0.5px' },
    liveTag: { fontSize: '9px', color: 'var(--brand-orange)', marginRight: '10px', fontWeight: 'bold' },
    stepSub: { margin: 0, fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' },
    transferAlert: { marginTop: '8px', padding: '6px 12px', background: 'var(--state-warning-bg)', color: 'var(--state-warning-text)', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }
};


export default TicketRoadmap;
