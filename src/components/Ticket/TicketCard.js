import React from 'react';
import { 
    Phone, Printer, Network, Monitor, Clock, 
    CheckCircle2, User, Building, Briefcase, AlertCircle
} from 'lucide-react';

const TicketCard = ({ ticket, onClick }) => {
    const getIcon = (cat) => {
        const c = cat?.toLowerCase() || '';
        if (c.includes('phone') || c.includes('هواتف')) return <Phone size={20} strokeWidth={1.5} />;
        if (c.includes('print') || c.includes('طابعات')) return <Printer size={20} strokeWidth={1.5} />;
        if (c.includes('network') || c.includes('شبكة')) return <Network size={20} strokeWidth={1.5} />;
        return <Monitor size={20} strokeWidth={1.5} />;
    };

    const isUrgent = ticket.urgency === 'high' || ticket.priority === 'High';
    const isClosed = ticket.status === 'مكتمل' || ticket.status === 'Closed';
    const isInProgress = ticket.status === 'جاري العمل' || ticket.status === 'In Progress';
    const isWaiting = ticket.status === 'قيد الانتظار' || ticket.status === 'Waiting' || ticket.status === 'بانتظار الإسناد';

    const getStatusConfig = () => {
        if (isClosed) return { color: 'var(--state-success-text)', bg: 'var(--state-success-bg)', label: 'تم المعالجة بنجاح' };
        if (isInProgress) return { color: 'var(--brand-accent)', bg: 'color-mix(in srgb, var(--brand-accent) 10%, transparent)', label: 'تحت التنفيذ' };
        if (isUrgent) return { color: 'var(--state-danger-text)', bg: 'var(--state-danger-bg)', label: 'حالة طارئة' };
        if (isWaiting) return { color: 'var(--state-warning-text)', bg: 'var(--state-warning-bg)', label: 'قيد المراجعة' };
        return { color: 'var(--text-tertiary)', bg: '#F1F5F9', label: 'بحاجة لتصنيف' };
    };

    const status = getStatusConfig();
    const formattedDate = ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString('ar-LY', { day: '2-digit', month: 'short' }) : 'الآن';

    return (
        <div onClick={onClick} className="neo-card neo-card-interactive" style={{ padding: '24px', display: 'flex', gap: '20px' }}>
            {/* Left Status Indicator Line */}
            <div style={{ position: 'absolute', right: 0, top: '24px', bottom: '24px', width: '4px', background: status.color, borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}></div>
            
            <div className="flex-center" style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F8FAFC', color: 'var(--brand-blue)', flexShrink: 0, border: '1px solid rgba(0,0,0,0.03)' }}>
                {getIcon(ticket.category)}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="flex-between">
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-tertiary)', letterSpacing: '1px', marginBottom: '6px' }}>
                            SIGNAL ID: LITC-{ticket.id?.slice(-6).toUpperCase()}
                        </div>
                        <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                            {ticket.subCategory || 'طلب استجابة تقنية غير محدد'}
                        </h3>
                    </div>
                    
                    <div style={{ background: status.bg, color: status.color, padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: '800' }}>
                        {status.label}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={16} color="var(--text-tertiary)" />
                        <span>{ticket.userName?.split(' ')[0] || 'غير معروف'}</span>
                    </div>
                    {ticket.building && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={16} color="var(--text-tertiary)" />
                            <span>{ticket.building}</span>
                        </div>
                    )}
                    {ticket.targetDepartment && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Briefcase size={16} color="var(--text-tertiary)" />
                            <span>{ticket.targetDepartment.substring(0, 20)}</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: 'auto', background: '#F1F5F9', padding: '6px 14px', borderRadius: '8px', color: 'var(--text-primary)' }}>
                        <Clock size={14} color="var(--brand-accent)" /> 
                        <span style={{ fontSize: '12px', fontWeight: 800 }}>{formattedDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketCard;
