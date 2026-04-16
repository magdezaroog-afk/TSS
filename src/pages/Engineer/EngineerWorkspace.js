import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, onSnapshot, updateDoc, doc, arrayUnion, limit, where } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import TicketDetailsModal from '../../components/Ticket/TicketDetailsModal';
import {
    Wrench, User, Search, LogOut, 
    CheckCircle2, X, Clock
} from 'lucide-react';

const EngineerWorkspace = () => {
    const { currentUser, userData, logout } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [engineers, setEngineers] = useState([]);
    const [searchParams] = useSearchParams();

    const techLevel = userData?.techLevel || 'junior';

    useEffect(() => {
        const unsubEngs = onSnapshot(query(collection(db, "users"), where("role", "==", "engineer")), (snap) => {
            setEngineers(snap.docs.map(d => ({ email: d.data().email, name: d.data().displayName || d.data().email.split('@')[0] })));
        });
        return () => unsubEngs();
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        // Logic for Team Leads: They can see more than just their assigned tickets if needed
        const q = techLevel === 'lead' 
            ? query(collection(db, "tickets"), limit(100)) // Leads see department flow
            : query(collection(db, "tickets"), where("assignedTo", "==", currentUser.email), limit(100));

        const unsubscribe = onSnapshot(q, (snap) => {
            const ticketData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTickets(ticketData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentUser, techLevel]);

    const handleAction = async (e, ticketId, newStatus) => {
        if (e) e.stopPropagation();
        try {
            await updateDoc(doc(db, "tickets", ticketId), {
                status: newStatus,
                updatedAt: new Date(),
                comments: arrayUnion({
                    text: `تحديث الحالة إلى [${newStatus}]`,
                    author: currentUser.email.split('@')[0],
                    role: 'engineer',
                    createdAt: new Date().toISOString(),
                    isSystem: true 
                })
            });
            toast.success("تم تحديث الحالة بنجاح");
        } catch (e) { toast.error("فشل التحديث"); }
    };

    const handleSelfAssign = async (ticketId) => {
        try {
            await updateDoc(doc(db, "tickets", ticketId), {
                assignedTo: currentUser.email,
                status: 'جاري العمل',
                updatedAt: new Date(),
                comments: arrayUnion({
                    text: `قام المهندس بسحب التذكرة وبدء العمل عليها`,
                    author: currentUser.email.split('@')[0],
                    role: 'engineer',
                    createdAt: new Date().toISOString(),
                    isSystem: true 
                })
            });
            toast.success("تم إسناد التذكرة لك");
        } catch (e) { toast.error("فشل الإسناد"); }
    };

    const handleTransfer = async (ticketId, targetEmail) => {
        if (!targetEmail) return;
        try {
            await updateDoc(doc(db, "tickets", ticketId), {
                transferTo: targetEmail,
                transferFrom: currentUser.email,
                isTransferPending: true,
                comments: arrayUnion({
                    text: `تم طلب تحويل التذكرة إلى: ${targetEmail.split('@')[0]}`,
                    author: currentUser.email.split('@')[0],
                    role: 'engineer',
                    createdAt: new Date().toISOString(),
                    isSystem: true 
                })
            });
            toast.info("تم إرسال طلب التحويل للمهندس المختص");
        } catch (e) { toast.error("فشل إرسال التحويل"); }
    };

    const handleAcceptTransfer = async (ticketId, accept) => {
        try {
            const ticketRef = doc(db, "tickets", ticketId);
            if (accept) {
                await updateDoc(ticketRef, {
                    assignedTo: currentUser.email,
                    transferTo: null,
                    isTransferPending: false,
                    status: 'جاري العمل',
                    comments: arrayUnion({
                        text: `تم قبول التحويل وبدء المعالجة`,
                        author: currentUser.email.split('@')[0],
                        role: 'engineer',
                        createdAt: new Date().toISOString(),
                        isSystem: true 
                    })
                });
                toast.success("تم قبول المهمة");
            } else {
                await updateDoc(ticketRef, {
                    transferTo: null,
                    isTransferPending: false,
                    comments: arrayUnion({
                        text: `تم رفض التحويل من قبل المهندس`,
                        author: currentUser.email.split('@')[0],
                        role: 'engineer',
                        createdAt: new Date().toISOString(),
                        isSystem: true 
                    })
                });
                toast.warning("تم رفض التحويل");
            }
        } catch (e) { toast.error("فشل تنفيذ الإجراء"); }
    };

    const filteredTickets = tickets.filter(t => 
        (t.subCategory + t.description).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.page}>
             <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;700;800&display=swap');`}
            </style>
            <aside style={styles.sidebar}>
                <div style={styles.logoSec}>
                    <div style={styles.logo}><Wrench size={20} /></div>
                    <div>
                        <div style={styles.lMain}>TechTrack</div>
                        <div style={styles.lSub}>المركز التقني</div>
                    </div>
                </div>

                <div style={styles.uBox}>
                    <div style={{...styles.uChar, background: techLevel === 'lead' ? 'var(--brand-blue)' : techLevel === 'senior' ? 'var(--brand-accent)' : 'var(--text-tertiary)'}}>
                        {currentUser?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                        <div style={styles.uName}>{userData?.displayName || 'مهندس'}</div>
                        <div style={styles.uRole}>
                            {techLevel === 'lead' ? 'رئيس فريق' : techLevel === 'senior' ? 'مهندس مختص' : 'مهندس ميداني'}
                        </div>
                    </div>
                </div>

                <div style={styles.miniStats}>
                    <div style={styles.msItem}><span>{tickets.length}</span> مهمة</div>
                    <div style={styles.msItem}><span>{tickets.filter(t=>t.status==='مكتمل').length}</span> تم</div>
                </div>

                <button onClick={logout} style={styles.logoutBtn}>
                    <LogOut size={14} /> خروج آمن
                </button>
            </aside>

            <main style={styles.main}>
                <header style={styles.header}>
                    <h1 style={styles.h1}>
                        {techLevel === 'lead' ? 'لوحة إشراف الفريق' : techLevel === 'senior' ? 'المهام التقنية المختصة' : 'مهامي الميدانية'}
                    </h1>
                    <div style={styles.searchWrap}>
                        <Search size={14} style={styles.sIcon} color="#94a3b8" />
                        <input type="text" placeholder="بحث..." style={styles.sInput} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </header>

                {/* Lead-Specific Macro View */}
                {techLevel === 'lead' && (
                    <div style={styles.leadStrip}>
                        <div style={styles.leadBox}>
                            <div style={styles.leadVal}>{tickets.filter(t=>t.status==='جاري العمل').length}</div>
                            <div style={styles.leadLab}>تذاكر قيد المعالجة حالياً</div>
                        </div>
                        <div style={styles.leadBox}>
                            <div style={styles.leadVal}>{new Set(tickets.map(t=>t.assignedTo)).size}</div>
                            <div style={styles.leadLab}>مهندسين نشطين في الميدان</div>
                        </div>
                        <div style={styles.leadBox}>
                            <div style={styles.leadVal}>{tickets.filter(t=>t.urgency==='high').length}</div>
                            <div style={styles.leadLab}>حالات حرجة تتطلب متابعة</div>
                        </div>
                    </div>
                )}

                <div style={styles.dynamicGrid}>
                    {loading ? (
                        <div style={styles.loading}>جاري التحميل...</div>
                    ) : (
                        filteredTickets.map(t => (
                            <div key={t.id} onClick={() => { setSelectedTicket(t); setIsModalOpen(true); }} style={{...styles.card, borderTop: `4px solid ${t.urgency === 'high' ? 'var(--state-danger-text)' : 'var(--glass-border)'}`}}>
                                <div style={styles.cardHead}>
                                    <span style={styles.ticketId}>#{t.id.slice(-6).toUpperCase()}</span>
                                    {t.isTransferPending && t.transferTo === currentUser.email ? (
                                        <span style={{...styles.seniorBadge, background: 'var(--brand-orange)', color: '#fff'}}>طلب تحويل وارد</span>
                                    ) : (
                                        techLevel === 'senior' && <span style={styles.seniorBadge}>مهمة تخصصية</span>
                                    )}
                                    <span style={styles.timeTag}><Clock size={12}/> {new Date(t.createdAt?.toDate?.() || t.createdAt).toLocaleDateString('ar-LY')}</span>
                                </div>
                                <h3 style={styles.title}>{t.subCategory}</h3>
                                {techLevel === 'lead' && <div style={styles.leadAssignee}>المهندس: {t.assignedTo?.split('@')[0] || 'غير مسند'}</div>}
                                <div style={styles.meta}>
                                    <div style={styles.metaIcon}><User size={12}/> {t.userName}</div>
                                    <div style={{...styles.metaIcon, color: t.status === 'مكتمل' ? 'var(--state-success-text)' : 'var(--brand-orange)'}}><CheckCircle2 size={12}/> {t.status}</div>
                                </div>
                                
                                {t.isTransferPending && t.transferTo === currentUser.email ? (
                                    <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                                        <button onClick={(e) => { e.stopPropagation(); handleAcceptTransfer(t.id, true); }} style={{...styles.btnDone, flex: 1, background: 'var(--brand-blue)'}}>قبول</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleAcceptTransfer(t.id, false); }} style={{...styles.btnDone, flex: 1, background: 'var(--state-danger-bg)', color: 'var(--state-danger-text)'}}>رفض</button>
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px'}}>
                                        {t.status !== 'مكتمل' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleAction(e, t.id, 'مكتمل'); }} style={{...styles.btnDone, flex: 1}}>إتمام المهمة</button>
                                        )}
                                        {techLevel === 'lead' && !t.assignedTo && (
                                            <button onClick={(e) => { e.stopPropagation(); handleSelfAssign(t.id); }} style={{...styles.btnDone, flex: 1, background: 'var(--brand-orange)'}}>سحب المهمة</button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Team Leaderboard / Performance for Lead Engineers */}
                {techLevel === 'lead' && (
                    <div style={{marginTop: '40px'}}>
                        <h2 style={{...styles.h1, fontSize: '20px', marginBottom: '20px'}}>مؤشرات أداء الفريق (Leaderboard)</h2>
                        <div style={styles.dynamicGrid}>
                            {Array.from(new Set(tickets.map(t => t.assignedTo))).filter(Boolean).map(engEmail => {
                                const engTickets = tickets.filter(t => t.assignedTo === engEmail);
                                const completed = engTickets.filter(t => t.status === 'مكتمل').length;
                                return (
                                    <div key={engEmail} style={styles.engStatsCard}>
                                        <div style={styles.uCharSmall}>{engEmail[0].toUpperCase()}</div>
                                        <div style={{flex: 1}}>
                                            <div style={{fontWeight: '800'}}>{engEmail.split('@')[0]}</div>
                                            <div style={{fontSize: '10px', color: 'var(--text-tertiary)'}}>مهندس ميداني</div>
                                            <div style={styles.progBar}><div style={{...styles.progFill, width: `${(completed / (engTickets.length || 1)) * 100}%`}}></div></div>
                                        </div>
                                        <div style={{textAlign: 'left'}}>
                                            <div style={{fontSize: '14px', fontWeight: '900', color: 'var(--brand-blue)'}}>{completed} / {engTickets.length}</div>
                                            <div style={{fontSize: '9px', fontWeight: '800'}}>إنجاز</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isModalOpen && selectedTicket && (
                    <div style={styles.detailPane}>
                         <div style={styles.paneHeader}>
                            <div style={styles.paneTitle}>معاينة تفصيلية: #{selectedTicket.id.slice(-6).toUpperCase()}</div>
                            <button onClick={() => setIsModalOpen(false)} style={styles.paneClose}><X size={18} /> إغلاق</button>
                        </div>
                        <div style={styles.paneContent}>
                            <TicketDetailsModal 
                                ticket={selectedTicket} 
                                isOpen={true} 
                                onClose={() => setIsModalOpen(false)} 
                                userRole="engineer" 
                                isEmbedded={true} 
                                engineers={engineers}
                                onTransfer={handleTransfer}
                                techLevel={techLevel}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const styles = {
    page: { display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', direction: 'rtl', fontFamily: "'Cairo', 'Outfit', sans-serif" },
    sidebar: { width: '260px', padding: '30px 20px', background: 'var(--bg-sidebar)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', transition: 'background-color 0.5s ease' },
    logoSec: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' },
    logo: { width: '36px', height: '36px', background: 'var(--brand-blue)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
    lMain: { fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' },
    lSub: { fontSize: '11px', color: 'var(--text-tertiary)' },
    uBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass-border)', padding: '15px', borderRadius: '12px', marginBottom: '20px' },
    uChar: { width: '32px', height: '32px', background: 'var(--brand-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' },
    uName: { fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' },
    uRole: { fontSize: '11px', color: 'var(--text-tertiary)' },
    miniStats: { display: 'flex', gap: '10px', marginBottom: '20px' },
    msItem: { flex: 1, padding: '10px', background: 'var(--glass-border)', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '800', color: 'var(--text-primary)' },
    logoutBtn: { marginTop: 'auto', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--state-danger-bg)', background: 'transparent', color: 'var(--state-danger-text)', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' },
    main: { flex: 1, padding: '40px', position: 'relative' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    h1: { fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)' },
    searchWrap: { position: 'relative', width: '280px' },
    sIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
    sInput: { width: '100%', padding: '10px 40px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none' },
    dynamicGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: 'var(--glass-blur)', WebkitBackdropFilter: 'var(--glass-blur)', boxShadow: 'var(--shadow-card)' },
    cardHead: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    ticketId: { fontSize: '11px', fontWeight: '900', color: 'var(--text-tertiary)' },
    timeTag: { fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' },
    title: { fontSize: '16px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-primary)' },
    meta: { display: 'flex', gap: '15px', fontSize: '11px', color: 'var(--text-secondary)' },
    btnDone: { width: '100%', padding: '10px', marginTop: '20px', background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' },
    loading: { textAlign: 'center', padding: '50px', color: 'var(--text-tertiary)' },
    detailPane: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-app)', zIndex: 100, display: 'flex', flexDirection: 'column' },
    paneHeader: { padding: '15px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-sidebar)', backdropFilter: 'var(--glass-blur)' },
    paneTitle: { fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' },
    paneClose: { background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' },
    paneContent: { flex: 1, overflowY: 'auto' },
    leadStrip: { display: 'flex', gap: '15px', marginBottom: '30px' },
    leadBox: { flex: 1, background: 'var(--bg-surface)', padding: '20px', borderRadius: '18px', border: '1px solid var(--glass-border)', textAlign: 'center', boxShadow: 'var(--shadow-card)', backdropFilter: 'var(--glass-blur)' },
    leadVal: { fontSize: '26px', fontWeight: '900', color: 'var(--brand-blue)' },
    leadLab: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '900', marginTop: '8px' },
    seniorBadge: { background: 'var(--state-success-bg)', color: 'var(--brand-blue)', padding: '4px 10px', borderRadius: '8px', fontSize: '9px', fontWeight: '900' },
    leadAssignee: { fontSize: '11px', color: 'var(--brand-blue)', fontWeight: '800', marginBottom: '10px', background: 'var(--glass-border)', padding: '6px 12px', borderRadius: '8px', display: 'inline-block' },
    metaIcon: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' },
    engStatsCard: { background: 'var(--bg-surface)', padding: '15px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '15px', backdropFilter: 'var(--glass-blur)' },
    progBar: { width: '100%', height: '4px', background: 'var(--bg-app)', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' },
    progFill: { height: '100%', background: 'var(--brand-blue)', borderRadius: '10px' }
};

export default EngineerWorkspace;
