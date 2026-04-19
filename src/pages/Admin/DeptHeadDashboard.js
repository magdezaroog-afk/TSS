import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, arrayUnion, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import TicketDetailsModal from '../../components/Ticket/TicketDetailsModal';
import ReportsAnalyst from '../../components/Admin/ReportsAnalyst';
import PerformanceReport from '../../components/Admin/PerformanceReport';
import {
    BarChart3, AlertCircle, Users, Building2, Search, 
    LogOut, ChevronLeft, X, MessageSquare
} from 'lucide-react';

const DeptHeadDashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [activities, setActivities] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('الكل');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supportChats, setSupportChats] = useState([]);
    const [replyMsg, setReplyMsg] = useState("");
    const [activeChatId, setActiveChatId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const unsubUsers = onSnapshot(query(collection(db, "users")), snap => {
            const list = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            setAllUsers(list);
            setEngineers(list.filter(u => u.role === 'engineer'));
        });
        const unsubTickets = onSnapshot(query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(250)), snap => {
            const ticketData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTickets(ticketData);

            const tid = searchParams.get('ticketId');
            if (tid) {
                const found = ticketData.find(t => t.id === tid);
                if (found) {
                    setSelectedTicket(found);
                    setIsModalOpen(true);
                }
            }
        });
        const unsubActivities = onSnapshot(query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(20)), snap => {
            setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubSupport = onSnapshot(query(collection(db, "support_chats")), snap => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setSupportChats(list.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
        });

        return () => { unsubUsers(); unsubTickets(); unsubActivities(); unsubSupport(); };
    }, [searchParams]);

    const logActivity = async (action) => {
        try {
            await addDoc(collection(db, "activities"), {
                user: currentUser?.displayName || currentUser?.email?.split('@')[0],
                action: action,
                timestamp: serverTimestamp()
            });
        } catch (e) { console.error("Activity logging failed", e); }
    };

    const getSLAStatus = (ticket) => {
        if (ticket.status === 'مكتمل' || ticket.status === 'Closed') return { label: 'مكتمل', color: 'var(--state-success-text)' };
        const created = ticket.createdAt?.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt);
        const diffHrs = (new Date() - created) / (1000 * 60 * 60);
        const limit = (ticket.urgency === 'high' || ticket.priority === 'High') ? 4 : 24;
        const remaining = limit - diffHrs;
        if (remaining < 0) return { label: 'تجاوز SLA', color: 'var(--state-danger-text)', isLate: true };
        return { label: `متبقي ${Math.ceil(remaining)}س`, color: 'var(--brand-accent)' };
    };

    const handleAssign = async (ticketId, engEmail) => {
        try {
            const currentTicket = tickets.find(t => t.id === ticketId);
            const newStatus = (currentTicket?.status === 'مكتمل' || currentTicket?.status === 'Closed')
                ? currentTicket.status : 'جاري العمل';

            await updateDoc(doc(db, "tickets", ticketId), {
                assignedTo: engEmail,
                updatedAt: new Date(),
                status: newStatus,
                comments: arrayUnion({
                    text: `إسناد إداري للمهندس: ${engEmail.split('@')[0]}`,
                    author: 'رئيس القسم',
                    role: 'dept_head',
                    createdAt: new Date().toISOString(),
                    isSystem: true
                })
            });
            await logActivity(`قام بإسناد التذكرة #${ticketId.slice(-6)} للمهندس ${engEmail.split('@')[0]}`);
            toast.success("تم الإسناد للمهندس المختار");
        } catch (e) {
            toast.error("حدث خطأ أثناء الإسناد");
        }
    };

    const handleSelectTicket = (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
        setSearchParams({ ticketId: ticket.id });
    };

    const handlePromotionRequest = async () => {
        const message = window.prompt("اكتب سبب طلب الترقية للموظف المختار أو لنفسك:");
        if (!message) return;
        try {
            await addDoc(collection(db, "notifications"), {
                to: 'admin',
                from: currentUser.email,
                type: 'promotion_request',
                message: message,
                createdAt: serverTimestamp(),
                status: 'unread'
            });
            toast.success("تم إرسال طلب الترقية للإدارة العليا بنجاح");
        } catch (e) { toast.error("فشل إرسال الطلب"); }
    };

    const handleReplyChat = async (userEmail) => {
        if (!replyMsg.trim()) return;
        try {
            await addDoc(collection(db, "support_chats"), {
                userEmail: userEmail,
                userName: "Support Team",
                text: replyMsg,
                createdAt: serverTimestamp(),
                type: 'support'
            });
            setReplyMsg("");
            toast.success("تم إرسال الرد");
        } catch (e) { toast.error("فشل إرسال الرد"); }
    };

    const stats = useMemo(() => ({
        total: tickets.length,
        pending: tickets.filter(t => !t.assignedTo).length,
        active: tickets.filter(t => t.status === 'جاري العمل').length,
        done: tickets.filter(t => t.status === 'مكتمل' || t.status === 'Closed').length
    }), [tickets]);

    const displayTickets = tickets.filter(t => {
        const matchesStatus = filterStatus === 'الكل' || (filterStatus === 'معلق' && !t.assignedTo) || (filterStatus === t.status);
        const pool = (t.subCategory + t.description + t.userName + t.id).toLowerCase();
        return pool.includes(searchQuery.toLowerCase()) && matchesStatus;
    });

    const handleDrillDown = (status, sq = '') => {
        setFilterStatus(status);
        setSearchQuery(sq);
        setActiveTab('tickets');
    };

    return (
        <div style={styles.page}>
            <style>
                {`
                .admin-scroll::-webkit-scrollbar { width: 5px; }
                .admin-scroll::-webkit-scrollbar-thumb { background: var(--brand-orange); border-radius: 10px; }
                `}
            </style>

            <aside style={styles.sidebarWrapper}>
                <div style={styles.sidebarBody}>
                    <div style={styles.logoSec}>
                        <div style={styles.logo}>DH</div>
                        <div>
                            <div style={styles.lMain}>TechTrack</div>
                            <div style={styles.lSub}>إدارة العمليات</div>
                        </div>
                    </div>

                    <nav style={styles.nav}>
                        <button style={{ ...styles.navTab, ...(activeTab === 'overview' ? styles.navActive : {}) }} onClick={() => setActiveTab('overview')}>
                            <BarChart3 size={16} /> <span>المؤشرات</span>
                        </button>
                        <button style={{ ...styles.navTab, ...(activeTab === 'tickets' ? styles.navActive : {}) }} onClick={() => setActiveTab('tickets')}>
                            <AlertCircle size={16} /> <span>توزيع المهام</span>
                            {stats.pending > 0 && <span style={styles.badgeAlert}>{stats.pending}</span>}
                        </button>
                        <button style={{ ...styles.navTab, ...(activeTab === 'engineers' ? styles.navActive : {}) }} onClick={() => setActiveTab('engineers')}>
                            <Users size={16} /> <span>فريق العمل</span>
                        </button>
                        <button style={{ ...styles.navTab, ...(activeTab === 'reports' ? styles.navActive : {}) }} onClick={() => setActiveTab('reports')}>
                            <Building2 size={16} /> <span>التقارير</span>
                        </button>
                        <button style={{ ...styles.navTab, ...(activeTab === 'support' ? styles.navActive : {}) }} onClick={() => setActiveTab('support')}>
                            <MessageSquare size={16} /> <span>الدردشة الفورية</span>
                        </button>
                    </nav>

                    <div style={styles.sideFooter}>
                        <div style={styles.uBox}>
                            <div style={styles.uChar}>{currentUser?.email?.[0].toUpperCase()}</div>
                            <div style={{overflow: 'hidden'}}>
                                <div style={styles.uName}>{userData?.displayName || currentUser?.email?.split('@')[0]}</div>
                                <div style={styles.uRole}>رئيس القسم</div>
                            </div>
                        </div>
                        <button onClick={logout} style={styles.logoutBtn}>
                            <LogOut size={14} /> خروج آمن
                        </button>
                    </div>
                </div>
            </aside>

            <main style={{...styles.main, paddingRight: isModalOpen ? 0 : '30px'}}>
                <header style={styles.header}>
                    <h1 style={styles.h1}>مكتب رئيس القسم</h1>
                    <div style={styles.searchWrap}>
                        <Search size={14} style={styles.sIcon} color="#94a3b8" />
                        <input type="text" value={searchQuery} placeholder="بحث شامل..." style={styles.sInput} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </header>

                <div style={styles.mainWrapper}>
                    <div style={{ ...styles.content, flex: isModalOpen ? '0 0 500px' : '1' }}>
                        {activeTab === 'overview' && (
                            <div style={styles.dashboardGrid}>
                                <div style={styles.statsStrip}>
                                    <div onClick={() => setFilterStatus('الكل')} style={{...styles.statBox, ...(filterStatus === 'الكل' && styles.statActive)}}><span>{stats.total}</span> الكل</div>
                                    <div onClick={() => setFilterStatus('معلق')} style={{...styles.statBox, borderTop: '4px solid var(--brand-orange)'}}><span>{stats.pending}</span> بانتظار إسناد</div>
                                    <div onClick={() => setFilterStatus('جاري العمل')} style={{...styles.statBox, borderTop: '4px solid var(--brand-blue)'}}><span>{stats.active}</span> بالمعالجة</div>
                                    <div onClick={() => setFilterStatus('مكتمل')} style={{...styles.statBox, borderTop: '4px solid var(--state-success-text)'}}><span>{stats.done}</span> تم حلها</div>
                                </div>

                                <div style={styles.overviewFlex}>
                                    <div style={styles.activityPane}>
                                        <div style={styles.paneLabel}><Zap size={14} /> النشاط العملياتي الموحد</div>
                                        <div style={styles.activityList}>
                                            {activities.length === 0 ? (
                                                <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)'}}>بانتظار وصول إشارات جديدة...</div>
                                            ) : (
                                                activities.map(act => (
                                                    <div key={act.id} style={styles.actItem}>
                                                        <div style={styles.actDot}></div>
                                                        <div style={styles.actBody}>
                                                            <div style={styles.actText}><b>{act.user}</b> {act.action}</div>
                                                            <div style={styles.actTime}>{act.timestamp?.toDate ? new Date(act.timestamp.toDate()).toLocaleTimeString('ar-LY') : 'الآن'}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <div style={styles.planetPane}>
                                        <div style={styles.paneLabel}><BarChart3 size={14} /> التوزيع الجغرافي والتقني</div>
                                        <div style={styles.splineWrapper}>
                                            <div style={{padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                                {['كم4', 'مبنى الشط', 'مبنى السياحية'].map(loc => (
                                                    <div key={loc} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                        <span style={{fontSize: '12px', fontWeight: '800'}}>{loc}</span>
                                                        <div style={{flex: 1, height: '6px', background: 'var(--bg-app)', margin: '0 15px', borderRadius: '10px', overflow: 'hidden'}}>
                                                            <div style={{width: `${(tickets.filter(t=>t.building===loc).length / (tickets.length || 1)) * 100}%`, height: '100%', background: 'var(--brand-blue)'}}></div>
                                                        </div>
                                                        <span style={{fontSize: '11px', fontWeight: '900', color: 'var(--brand-blue)'}}>{tickets.filter(t=>t.building===loc).length}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={styles.planetOverlay}>
                                                <div style={styles.planetCount}>{tickets.length}</div>
                                                <div style={styles.planetLabel}>إجمالي البلاغات</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' ? (
                            <div style={{background: 'var(--bg-surface)', borderRadius: '20px', border: '1px solid var(--glass-border)'}}>
                                <div style={{padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <h2 style={styles.h2}>التقارير التحليلية</h2>
                                    <span style={{fontSize: '11px', color: 'var(--text-tertiary)'}}>اضغط بالأسفل لطلب تقرير رسمي</span>
                                </div>
                                <PerformanceReport tickets={tickets} engineers={engineers} />
                                <div style={{padding: '40px', borderTop: '1px solid var(--glass-border)'}}>
                                     <ReportsAnalyst tickets={tickets} engineers={engineers} onDrillDown={handleDrillDown} />
                                </div>
                            </div>
                        ) : activeTab === 'engineers' ? (
                            <div style={styles.engSection}>
                                <div style={{...styles.paneLabel, marginBottom: '20px', fontSize: '18px'}}>قائمة التميز التقني (Engineers Leaderboard)</div>
                                <div style={styles.engGrid}>
                                    {[...engineers].sort((a,b) => tickets.filter(t=>t.assignedTo===b.email && t.status==='مكتمل').length - tickets.filter(t=>t.assignedTo===a.email && t.status==='مكتمل').length).map((u, rank) => (
                                        <div key={u.uid} style={{...styles.engCard, border: rank === 0 ? '2px solid var(--brand-blue)' : '1px solid var(--glass-border)'}}>
                                            {rank === 0 && <div style={{fontSize: '10px', fontWeight: '800', color: 'var(--brand-blue)', marginBottom: '10px'}}>🏆 الأكثر إنجازاً</div>}
                                            <div style={styles.engInfo}>
                                                <div style={{...styles.statCircle, borderColor: u.techLevel === 'lead' ? 'var(--brand-blue)' : u.techLevel === 'senior' ? 'var(--brand-accent)' : 'var(--text-tertiary)'}}>
                                                    {u.displayName?.[0] || 'E'}
                                                </div>
                                                <div>
                                                    <div style={styles.engName}>{u.displayName || u.email.split('@')[0]}</div>
                                                    <div style={{...styles.engBadge, background: u.techLevel === 'lead' ? 'var(--brand-blue)' : u.techLevel === 'senior' ? 'var(--brand-orange)' : 'var(--bg-app)', color: u.techLevel === 'lead' ? '#fff' : (u.techLevel === 'senior' ? '#fff' : 'var(--text-primary)')}}>
                                                        {u.techLevel === 'lead' ? 'رئيس فريق' : u.techLevel === 'senior' ? 'مهندس مختص' : 'مهندس ميداني'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={styles.engStats}>
                                                <div style={styles.engStatRow}>
                                                    <span>قيد المعالجة:</span>
                                                    <b>{tickets.filter(t => t.assignedTo === u.email && t.status === 'جاري العمل').length}</b>
                                                </div>
                                                <div style={styles.engStatRow}>
                                                    <span>إجمالي الإنجاز:</span>
                                                    <b>{tickets.filter(t => t.assignedTo === u.email && (t.status === 'مكتمل' || t.status === 'Closed')).length}</b>
                                                </div>
                                            </div>
                                            <button onClick={() => handlePromotionRequest()} style={{...styles.btnAction, width: '100%', marginTop: '15px', background: 'var(--brand-orange)', color: '#fff', border: 'none'}}>إرسال طلب ترقية لمسؤول النظام</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : activeTab === 'support' ? (
                            <div style={styles.supportContainer}>
                                <div style={styles.chatListSide}>
                                    <div style={styles.paneLabel}>دردشات الموظفين</div>
                                    {[...new Set(supportChats.map(c => c.userEmail))].map(email => (
                                        <div key={email} onClick={() => setActiveChatId(email)} style={{...styles.chatCard, borderRight: activeChatId === email ? '4px solid var(--brand-blue)' : 'none'}}>
                                            <div style={{fontWeight: '800'}}>{email.split('@')[0]}</div>
                                            <div style={{fontSize: '10px', color: 'var(--text-tertiary)'}}>{supportChats.filter(c => c.userEmail === email).slice(-1)[0]?.text.slice(0, 30)}...</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={styles.chatDetailSide}>
                                    {activeChatId ? (
                                        <>
                                            <div style={styles.chatHeaderMini}>دردشة مع {activeChatId}</div>
                                            <div style={styles.chatMsgsBox}>
                                                {supportChats.filter(c => c.userEmail === activeChatId).map(m => (
                                                    <div key={m.id} style={m.type === 'support' ? styles.msgSupport : styles.msgUser}>
                                                        <b>{m.userName}:</b> {m.text}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={styles.replyArea}>
                                                <input value={replyMsg} onChange={e => setReplyMsg(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleReplyChat(activeChatId)} placeholder="اكتب ردك هنا..." style={styles.replyInput} />
                                                <button onClick={() => handleReplyChat(activeChatId)} style={styles.replyBtn}>إرسال</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)'}}>
                                            <MessageSquare size={48} opacity={0.2} />
                                            <div>اختر دردشة للرد عليها</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={styles.ticketsView}>
                                <div className="admin-scroll" style={{...styles.compactList, height: isModalOpen ? 'calc(100vh - 350px)' : 'auto', overflowY: isModalOpen ? 'auto' : 'visible'}}>
                                    <div style={styles.tableHead}>
                                        <div style={{width: '60px'}}>REF</div>
                                        <div style={{flex: 2}}>العنوان / القسم</div>
                                        <div style={{flex: 1}}>المهندس</div>
                                        <div style={{width: '100px'}}>الحالة</div>
                                        <div style={{width: '100px'}}>SLA</div>
                                    </div>
                                    {displayTickets.map(t => {
                                        const sla = getSLAStatus(t);
                                        return (
                                            <div key={t.id} onClick={() => handleSelectTicket(t)} style={{...styles.row, borderRight: `4px solid ${t.urgency === 'high' ? 'var(--state-danger-text)' : 'var(--glass-border)'}`}}>
                                                <div style={{width: '60px', fontWeight: '800', fontSize: '10px', color: 'var(--text-tertiary)'}}>#{t.id.slice(-6).toUpperCase()}</div>
                                                <div style={{flex: 2}}>
                                                    <div style={styles.rowTitle}>{t.subCategory}</div>
                                                    <div style={styles.rowSub}>{t.category} | {t.building}</div>
                                                </div>
                                                <div style={{flex: 1, fontSize: '11px'}} onClick={e => e.stopPropagation()}>
                                                    {!t.assignedTo ? (
                                                        <select style={styles.assignSel} onChange={e => e.target.value && handleAssign(t.id, e.target.value)}>
                                                            <option value="">إسناد...</option>
                                                            {engineers.map(e => <option key={e.email} value={e.email}>{e.displayName || e.email.split('@')[0]}</option>)}
                                                        </select>
                                                    ) : <span style={styles.assignedTo}>{t.assignedTo.split('@')[0]}</span>}
                                                </div>
                                                <div style={{width: '100px'}}>
                                                    <span style={{...styles.statusTag, background: (t.status === 'مكتمل' || t.status === 'Closed') ? 'var(--state-success-bg)' : 'var(--brand-orange)20', color: (t.status === 'مكتمل' || t.status === 'Closed') ? 'var(--state-success-text)' : 'var(--brand-orange)'}}>
                                                        {t.status}
                                                    </span>
                                                </div>
                                                <div style={{width: '100px', fontWeight: '800', fontSize: '10px', color: sla.color}}>{sla.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {isModalOpen && selectedTicket && activeTab !== 'reports' && activeTab !== 'engineers' && (
                        <div style={styles.detailPane}>
                            <div style={styles.paneHeader}>
                                <button onClick={() => { setIsModalOpen(false); setSearchParams({}); }} style={styles.paneClose}><ChevronLeft size={16} /> العودة</button>
                                <button onClick={() => { setIsModalOpen(false); setSearchParams({}); }} style={styles.paneX}><X size={16} /></button>
                            </div>
                            <div style={styles.paneContent}>
                                <TicketDetailsModal ticket={selectedTicket} isOpen={true} onClose={() => setIsModalOpen(false)} userRole="dept_head" isEmbedded={true} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const styles = {
    page: { display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', direction: 'rtl', fontFamily: "'Cairo', 'Outfit', sans-serif" },
    sidebarWrapper: { width: '270px', padding: '25px 15px', position: 'sticky', top: 0, height: 'max-content', zIndex: 100 },
    sidebarBody: { background: 'var(--bg-sidebar)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', padding: '25px 15px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backdropFilter: 'var(--glass-blur)', boxShadow: 'var(--shadow-card)' },
    logoSec: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '35px' },
    logo: { width: '36px', height: '36px', background: 'var(--brand-blue)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900' },
    lMain: { fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' },
    lSub: { fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '800' },
    nav: { display: 'flex', flexDirection: 'column', gap: '4px' },
    navTab: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', textAlign: 'right', fontWeight: '800', fontSize: '14px', transition: '0.2s', width: '100%' },
    navActive: { background: 'var(--glass-border)', color: 'var(--brand-blue)' },
    badgeAlert: { background: 'var(--state-danger-bg)', color: 'var(--state-danger-text)', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', marginLeft: 'auto', fontWeight: '900' },
    sideFooter: { marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' },
    uBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-app)', padding: '10px', borderRadius: '12px', marginBottom: '15px' },
    uChar: { width: '30px', height: '30px', background: 'var(--brand-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: '900' },
    uName: { fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' },
    uRole: { fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '700' },
    logoutBtn: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--state-danger-bg)', background: 'transparent', color: 'var(--state-danger-text)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' },
    main: { flex: 1, padding: '30px', overflowX: 'hidden' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    h1: { fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)' },
    mainWrapper: { display: 'flex', gap: '25px' },
    searchWrap: { position: 'relative', width: '280px' },
    sIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
    sInput: { width: '100%', padding: '10px 12px 10px 40px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', borderRadius: '12px', outline: 'none', fontSize: '13px' },
    content: { background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '25px', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)', boxShadow: 'var(--shadow-card)' },
    statsStrip: { display: 'flex', gap: '12px', marginBottom: '20px' },
    statBox: { flex: 1, padding: '15px', borderRadius: '16px', background: 'var(--bg-app)', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', transition: '0.3s' },
    statActive: { background: 'var(--brand-blue)', color: '#fff', borderColor: 'var(--brand-blue)' },
    dashboardGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
    overviewFlex: { display: 'flex', gap: '20px' },
    activityPane: { flex: 1.5, background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--glass-border)' },
    urgentPane: { flex: 1, background: 'var(--state-danger-bg)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--glass-border)' },
    planetPane: { flex: 1.2, background: 'var(--bg-app)', borderRadius: 'var(--radius-lg)', padding: '20px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' },
    splineWrapper: { flex: 1, position: 'relative', minHeight: '220px', borderRadius: '15px', overflow: 'hidden' },
    planetOverlay: { position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'center', pointerEvents: 'none' },
    planetCount: { fontSize: '20px', fontWeight: '900', color: 'var(--brand-blue)' },
    planetLabel: { fontSize: '9px', fontWeight: '800', opacity: 0.8, color: 'var(--text-primary)' },
    paneLabel: { fontSize: '13px', fontWeight: '900', marginBottom: '15px', color: 'var(--text-primary)' },
    activityList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    actItem: { display: 'flex', gap: '10px' },
    actDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-blue)', marginTop: '6px' },
    actBody: { flex: 1 },
    actText: { fontSize: '12px', color: 'var(--text-secondary)' },
    actTime: { fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '800' },
    engGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' },
    engCard: { padding: '20px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-card)' },
    engInfo: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '15px' },
    statCircle: { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', background: 'var(--bg-app)', color: 'var(--text-primary)' },
    engName: { fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' },
    engBadge: { fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', marginTop: '4px', display: 'inline-block' },
    engStats: { display: 'flex', flexDirection: 'column', gap: '8px' },
    engStatRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' },
    tableHead: { display: 'flex', padding: '10px 15px', background: 'var(--bg-app)', borderRadius: '10px', fontSize: '10px', fontWeight: '900', color: 'var(--text-tertiary)', marginBottom: '10px' },
    row: { display: 'flex', padding: '12px 15px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '10px', alignItems: 'center', cursor: 'pointer', marginBottom: '5px', transition: '0.2s', color: 'var(--text-primary)' },
    rowTitle: { fontSize: '13px', fontWeight: '800' },
    rowSub: { fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: '700' },
    statusTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' },
    assignSel: { padding: '4px', borderRadius: '6px', border: '1px solid var(--glass-border)', fontSize: '11px', background: 'var(--bg-app)', color: 'var(--text-primary)' },
    assignedTo: { color: 'var(--brand-blue)', fontWeight: '800', fontSize: '11px' },
    detailPane: { flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', height: 'calc(100vh - 60px)', position: 'sticky', top: '30px', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', backdropFilter: 'var(--glass-blur)', boxShadow: 'var(--shadow-card)' },
    paneHeader: { padding: '10px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' },
    paneClose: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' },
    paneX: { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' },
    paneContent: { flex: 1, overflowY: 'auto' },
    supportContainer: { display: 'flex', height: '500px', gap: '20px' },
    chatListSide: { flex: 1, background: 'var(--bg-app)', borderRadius: '15px', padding: '15px', overflowY: 'auto' },
    chatCard: { padding: '12px', background: 'var(--bg-surface)', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer', border: '1px solid var(--glass-border)' },
    chatDetailSide: { flex: 2, background: 'var(--bg-app)', borderRadius: '15px', display: 'flex', flexDirection: 'column', padding: '20px', border: '1px solid var(--glass-border)' },
    chatHeaderMini: { fontSize: '14px', fontWeight: '900', marginBottom: '15px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' },
    chatMsgsBox: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' },
    msgSupport: { background: 'var(--brand-blue)', color: '#fff', padding: '10px', borderRadius: '12px 12px 0 12px', alignSelf: 'flex-end', fontSize: '13px', maxWidth: '80%' },
    msgUser: { background: 'var(--bg-surface)', padding: '10px', borderRadius: '12px 12px 12px 0', alignSelf: 'flex-start', fontSize: '13px', maxWidth: '80%', border: '1px solid var(--glass-border)' },
    replyArea: { display: 'flex', gap: '10px' },
    replyInput: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none' },
    replyBtn: { background: 'var(--brand-blue)', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }
};

export default DeptHeadDashboard;
