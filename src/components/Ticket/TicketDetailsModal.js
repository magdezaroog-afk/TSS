import React, { useState } from 'react';
import { 
    X, Star, Send, CheckCircle2, AlertTriangle, 
    Building2, Briefcase, Paperclip, Info, Share2 
} from 'lucide-react';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import TicketRoadmap from './TicketRoadmap';
import { toast } from 'react-toastify';

const TicketDetailsModal = ({ ticket, isOpen, onClose, userRole, isEmbedded }) => {
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'history'
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showFullRoadmap, setShowFullRoadmap] = useState(false);

    const { currentUser } = useAuth();

    if (!isOpen || !ticket) return null;

    const handleAddComment = async (isInternal = false) => {
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            const ticketRef = doc(db, "tickets", ticket.id);
            await updateDoc(ticketRef, {
                comments: arrayUnion({
                    text: comment,
                    author: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Unknown',
                    email: currentUser?.email,
                    role: userRole,
                    isInternal: isInternal, // Add boolean flag
                    createdAt: new Date().toISOString()
                })
            });
            setComment('');
            toast.success("تمت إضافة ملاحظتك بنجاح");
        } catch (e) { 
            console.error(e);
            toast.error("حدث خطأ أثناء إضافة الملاحظة");
        }
        setSubmitting(false);
    };

    const handleRate = async (stars) => {
        setRating(stars);
        try {
            await updateDoc(doc(db, "tickets", ticket.id), {
                rating: stars
            });
            toast.success("شكراً لتقييمك الخدمة!");
        } catch (e) { 
            console.error(e); 
            toast.error("حدث خطأ أثناء إرسال التقييم");
        }
    };

    const copyTicketLink = () => {
        const link = `${window.location.origin}${window.location.pathname}?ticketId=${ticket.id}`;
        navigator.clipboard.writeText(link);
        toast.info("تم نسخ رابط التذكرة!");
    };

    const formatTime = (isoString) => {
        if (!isoString) return 'حالا';
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return 'منذ مدة'; }
    };

    const isClosed = ticket.status === 'مكتمل' || ticket.status === 'Closed';
    const isUrgent = ticket.urgency === 'high';

    const renderContent = () => (
        <div style={{...styles.panel, width: isEmbedded ? '100%' : '600px', height: isEmbedded ? '100%' : '100%'}}>
            {!isEmbedded && (
                <div style={styles.header}>
                    <div style={styles.hContent}>
                        <div style={styles.refCode}>REF #{ticket.id.slice(-8).toUpperCase()}</div>
                        <h2 style={styles.title}>{ticket.subCategory || ticket.category}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={copyTicketLink} style={styles.iconBtn} title="مشاركة الرابط"><Share2 size={18} /></button>
                        <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                    </div>
                </div>
            )}

            <div style={{...styles.scrollArea, padding: isEmbedded ? '25px' : '45px'}}>
                {isEmbedded && (
                     <div style={{marginBottom: '25px'}}>
                        <div style={styles.refCode}>TICKET REF #{ticket.id.slice(-8).toUpperCase()}</div>
                        <h2 style={{...styles.title, fontSize: '20px', marginTop: '5px'}}>{ticket.subCategory || ticket.category}</h2>
                        <button onClick={copyTicketLink} style={{...styles.textBtn, marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <Share2 size={14} /> نسخ الرابط للمشاركة
                        </button>
                    </div>
                )}

                {/* Modern Status Banner */}
                <div style={{ 
                    ...styles.banner, 
                    background: isClosed ? '#ecfdf5' : (isUrgent ? '#fef2f2' : '#f0f9ff'),
                    color: isClosed ? '#059669' : (isUrgent ? '#dc2626' : '#0284c7'),
                    border: `1px solid ${isClosed ? '#10b98120' : (isUrgent ? '#ef444420' : '#005C8420')}`
                }}>
                    {isClosed ? <CheckCircle2 size={20} /> : (isUrgent ? <AlertTriangle size={20} /> : <Info size={20} />)}
                    <div style={styles.bText}>
                        <div style={styles.bLabel}>الحالة التشغيلية</div>
                        <div style={styles.bVal}>{ticket.status}</div>
                    </div>
                    {!isClosed && (
                        <div style={{ marginRight: 'auto', textAlign: 'left' }}>
                            <div style={styles.bLabel}>اتفاقية مستوى الخدمة (SLA)</div>
                            <div style={{...styles.bVal, color: isUrgent ? '#dc2626' : '#0284c7'}}>
                                {(() => {
                                    const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
                                    const diffHrs = (new Date() - created) / (1000 * 60 * 60);
                                    const limit = isUrgent ? 4 : 24;
                                    const remaining = limit - diffHrs;
                                    return remaining > 0 ? `متبقي ${Math.ceil(remaining)} ساعة` : 'تم تجاوز الوقت المحدد';
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tab Switcher */}
                <div style={styles.tabNav}>
                    <button onClick={() => setActiveTab('details')} style={{...styles.tabBtn, ...(activeTab === 'details' ? styles.tabActive : {})}}>تفاصيل البلاغ</button>
                    {(userRole === 'engineer' || userRole === 'admin' || userRole === 'dept_head') && (
                        <button onClick={() => setActiveTab('internal_chat')} style={{...styles.tabBtn, ...(activeTab === 'internal_chat' ? styles.tabActive : {})}}>دردشة فنية داخلية</button>
                    )}
                    <button onClick={() => setActiveTab('history')} style={{...styles.tabBtn, ...(activeTab === 'history' ? styles.tabActive : {})}}>سجل الإجراءات والتواصل</button>
                </div>

                {activeTab === 'details' ? (
                    <>
                        <div style={styles.infoRow}>
                            <div style={styles.infoCard}>
                                <Building2 size={18} color="#64748b" strokeWidth={1.5} />
                                <div style={styles.mText}>
                                    <div style={styles.mLabel}>المبنى</div>
                                    <div style={styles.mVal}>{ticket.building || 'LITC SITE'}</div>
                                </div>
                            </div>
                            <div style={styles.infoCard}>
                                <Briefcase size={18} color="#64748b" strokeWidth={1.5} />
                                <div style={styles.mText}>
                                    <div style={styles.mLabel}>الإدارة</div>
                                    <div style={styles.mVal}>{ticket.targetDepartment || 'إدارة الصيانة'}</div>
                                </div>
                            </div>
                        </div>

                        {isClosed && (
                            <div style={styles.ratingCard}>
                                <div style={styles.ratingTitle}>تقييم جودة الحل</div>
                                <div style={styles.stars}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star
                                            key={s}
                                            onClick={() => handleRate(s)}
                                            size={28}
                                            fill={s <= (rating || ticket.rating || 0) ? '#f59e0b' : 'none'}
                                            style={{ color: s <= (rating || ticket.rating || 0) ? '#f59e0b' : '#cbd5e1', cursor: 'pointer' }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={styles.historySection}>
                        <div style={styles.timeline}>
                            {(!ticket.comments || ticket.comments.filter(c => activeTab === 'internal_chat' ? c.isInternal : !c.isInternal).length === 0) ? (
                                <div style={styles.emptyFeed}>لا توجد سجلات حالياً في هذا القسم.</div>
                            ) : (
                                [...ticket.comments].filter(c => activeTab === 'internal_chat' ? c.isInternal : !c.isInternal).reverse().map((c, i) => (
                                    <div key={i} style={styles.historyItem}>
                                        <div style={{...styles.historyDot, background: c.isSystem ? 'var(--brand-blue)' : (c.isInternal ? 'var(--brand-orange)' : 'var(--text-tertiary)')}}></div>
                                        <div style={styles.historyContent}>
                                            <div style={styles.historyHeader}>
                                                <span style={styles.historyRole}>{c.isSystem ? 'تحديث تلقائي' : (c.isInternal ? 'محادثة فنية سرية' : (c.role === 'engineer' ? 'إجراء تقني' : 'تعليق'))}</span>
                                                <span style={styles.historyTime}>{formatTime(c.createdAt)}</span>
                                            </div>
                                            <div style={styles.historyText}><b>{c.author}:</b> {c.text}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {!isClosed && activeTab !== 'details' && (
                <div style={{...styles.footer, padding: isEmbedded ? '20px 25px' : '35px 45px'}}>
                    <div style={styles.inputBox}>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={styles.textarea}
                            placeholder={activeTab === 'internal_chat' ? "رسالة سرية لفريق الدعم..." : "اكتب ملاحظة..."}
                        />
                        <button onClick={() => handleAddComment(activeTab === 'internal_chat')} disabled={submitting} style={{...styles.sendBtn, background: activeTab === 'internal_chat' ? 'var(--brand-orange)' : 'var(--brand-blue)'}}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    if (isEmbedded) {
        return renderContent();
    }

    return (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            {renderContent()}
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'flex-start', direction: 'rtl', backdropFilter: 'blur(5px)' },
    panel: { background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderLeft: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-card)' },
    header: { padding: '30px 45px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-sidebar)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    hContent: { display: 'flex', flexDirection: 'column', gap: '4px' },
    refCode: { fontSize: '10px', fontWeight: '900', color: 'var(--text-tertiary)', letterSpacing: '1px' },
    title: { fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 },
    iconBtn: { background: 'var(--bg-app)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    closeBtn: { background: 'var(--bg-app)', border: '1px solid var(--glass-border)', color: 'var(--state-danger-text)', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    scrollArea: { flex: 1, overflowY: 'auto' },
    banner: { padding: '15px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
    bText: { display: 'flex', flexDirection: 'column' },
    bLabel: { fontSize: '10px', fontWeight: '800', opacity: 0.8 },
    bVal: { fontSize: '14px', fontWeight: '900' },
    infoRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' },
    infoCard: { background: 'var(--bg-surface)', padding: '15px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)' },
    mText: { display: 'flex', flexDirection: 'column' },
    mLabel: { fontSize: '10px', fontWeight: '800', color: 'var(--text-tertiary)' },
    mVal: { fontSize: '13px', fontWeight: '900', color: 'var(--text-primary)' },
    section: { marginBottom: '35px' },
    sTitle: { fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    sHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    textBtn: { background: 'transparent', border: 'none', color: 'var(--brand-blue)', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
    emptyFeed: { textAlign: 'center', padding: '30px', fontSize: '12px', color: 'var(--text-tertiary)' },
    ratingCard: { background: 'var(--bg-surface)', padding: '25px', borderRadius: '20px', textAlign: 'center', marginTop: '20px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-card)' },
    ratingTitle: { marginBottom: '15px', fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' },
    stars: { display: 'flex', justifyContent: 'center', gap: '12px' },
    tabNav: { display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)' },
    tabBtn: { padding: '10px 0', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: '800', color: 'var(--text-tertiary)', cursor: 'pointer', position: 'relative' },
    tabActive: { color: 'var(--brand-blue)', borderBottom: '2px solid var(--brand-blue)' },
    historySection: { paddingTop: '10px' },
    timeline: { display: 'flex', flexDirection: 'column', gap: '20px' },
    historyItem: { display: 'flex', gap: '15px', position: 'relative' },
    historyDot: { width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', zIndex: 1 },
    historyContent: { flex: 1, background: 'var(--bg-surface)', padding: '12px 15px', borderRadius: '12px', border: '1px solid var(--glass-border)' },
    historyHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px' },
    historyRole: { fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--brand-blue)' },
    historyTime: { fontSize: '10px', color: 'var(--text-secondary)' },
    historyText: { fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' },
    footer: { borderTop: '1px solid var(--glass-border)', background: 'var(--bg-sidebar)' },
    inputBox: { position: 'relative' },
    textarea: { width: '100%', height: '80px', background: 'var(--bg-app)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '15px 15px 15px 60px', outline: 'none', fontSize: '14px', resize: 'none' },
    sendBtn: { position: 'absolute', left: '10px', bottom: '10px', width: '40px', height: '40px', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default TicketDetailsModal;
