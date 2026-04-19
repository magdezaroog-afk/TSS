import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TicketCard from '../../components/Ticket/TicketCard';
import TicketDetailsModal from '../../components/Ticket/TicketDetailsModal';
import { 
    LayoutGrid, History,
    Search, LogOut, Plus, UserCircle, Target, MessageCircle, 
    X
} from 'lucide-react';

const EmployeeDashboard = () => {
    const { currentUser, logout, userData } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams] = useSearchParams();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMsgs, setChatMsgs] = useState([]);
    const [newMsg, setNewMsg] = useState("");

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"), limit(100));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(t => t.userId === currentUser.uid || t.userEmail === currentUser.email);
            setTickets(ticketData);
            setLoading(false);
            
            const tid = searchParams.get('ticketId');
            if (tid) {
                const found = ticketData.find(t => t.id === tid);
                if (found) { setSelectedTicket(found); setIsModalOpen(true); }
            }
        });

        // Instant Support Chat Logic (JS sort to avoid index errors)
        const qChat = query(collection(db, "support_chats"), where("userEmail", "==", currentUser.email));
        const unsubChat = onSnapshot(qChat, snap => {
            const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setChatMsgs(msgs.sort((a,b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0)));
        });

        return () => { unsubscribe(); unsubChat(); };
    }, [currentUser, searchParams]);

    const handleSendChat = async () => {
        if (!newMsg.trim()) return;
        try {
            await addDoc(collection(db, "support_chats"), {
                userEmail: currentUser.email,
                userName: userData?.displayName || currentUser.email.split('@')[0],
                text: newMsg,
                createdAt: serverTimestamp(),
                type: 'user'
            });
            setNewMsg("");
        } catch (e) { console.error("Chat failed", e); }
    };

    const filteredTickets = tickets.filter(t => {
        const isTabMatch = activeTab === 'all' || (activeTab === 'active' ? (t.status !== 'مكتمل' && t.status !== 'Closed') : (t.status === 'مكتمل' || t.status === 'Closed'));
        const isSearchMatch = [t.subCategory, t.description, t.id].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()));
        return isTabMatch && isSearchMatch;
    });

    const activeCount = tickets.filter(t => t.status !== 'مكتمل' && t.status !== 'Closed').length;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', direction: 'rtl', padding: '16px' }}>
            
            {/* Ultra-Modern Floating Sidebar */}
            <aside className="scale-in" style={{ 
                width: '260px', 
                background: 'var(--bg-sidebar)', 
                borderRadius: 'var(--radius-lg)',
                padding: '32px 24px',
                display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--shadow-float)',
                color: 'var(--text-inverted)',
                position: 'sticky', top: '16px', height: 'calc(100vh - 32px)',
                zIndex: 50
            }}>
                <div className="flex-center" style={{ gap: '12px', marginBottom: '48px', justifyContent: 'flex-start' }}>
                    <div className="flex-center" style={{ 
                        width: '42px', height: '42px', 
                        background: 'var(--brand-accent)', 
                        borderRadius: '12px', boxShadow: 'var(--shadow-glow-blue)'
                    }}>
                        <Target size={22} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '-0.5px' }}>LITC Desk</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: '1px' }}>ENTERPRISE HQ</div>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px' }}>القائمة الرئيسية</div>
                    
                    <button onClick={() => setActiveTab('active')} style={{ 
                        ...styles.navBtn, 
                        background: activeTab === 'active' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: activeTab === 'active' ? '#fff' : 'rgba(255,255,255,0.6)'
                    }}>
                        <Activity size={18} /> 
                        <span>سير العمل النشط</span>
                        {activeCount > 0 && (
                            <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="pulse-dot"></div>
                                <span style={{ background: 'var(--brand-orange)', color: '#fff', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: '800' }}>{activeCount}</span>
                            </div>
                        )}
                    </button>

                    <button onClick={() => setActiveTab('history')} style={{ 
                        ...styles.navBtn, 
                        background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.6)'
                    }}>
                        <History size={18} /> 
                        <span>الأرشيف والتاريخ</span>
                    </button>
                    

                </nav>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex-between">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <UserCircle size={36} color="var(--brand-accent)" strokeWidth={1.5} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{userData?.displayName?.split(' ')[0] || 'User'}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>LITC Member</div>
                            </div>
                        </div>
                        <button onClick={logout} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#ef4444'} onMouseOut={e=>e.currentTarget.style.color='rgba(255,255,255,0.5)'}>
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Premium Main Context */}
            <main style={{ flex: 1, padding: '16px 40px 0 20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)', overflowY: 'auto' }}>
                
                {/* Ultra Clean Header */}
                <header className="flex-between stagger-1" style={{ marginBottom: '40px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--brand-blue)', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                            أهلاً بك، {userData?.displayName?.split(' ')[0] || 'في LITC'}
                        </h1>
                        <p style={{ fontSize: '15px', color: 'var(--text-tertiary)', margin: 0, fontWeight: '500' }}>مرحباً بك في نظام TSS المطور. نحن هنا لخدمتكم.</p>
                    </div>
                    
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '32px', flex: 1, paddingBottom: '32px' }}>
                    
                    <div style={{ flex: isModalOpen ? '1' : '1.8', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                        


                        {/* Ticket Feed */}
                        <div className="stagger-3" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="flex-between" style={{ marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0' }}>سجل طلباتي</h2>
                                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>متابعة حالة الطلبات في الوقت الفعلي</p>
                                </div>
                                {!isModalOpen && (
                                    <button className="btn-premium" onClick={() => navigate('/employee/create')}>
                                        <Plus size={18} /> طلب جديد
                                    </button>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-tertiary)', fontWeight: '600' }}>جاري التحميل...</div>
                                ) : filteredTickets.length > 0 ? (
                                    filteredTickets.map((ticket, index) => (
                                        <div key={ticket.id} style={{ animationDelay: `${index * 0.05}s` }} className="scale-in">
                                            <TicketCard 
                                                ticket={ticket} 
                                                onClick={() => { setSelectedTicket(ticket); setIsModalOpen(true); }} 
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-center neo-card" style={{ flexDirection: 'column', padding: '80px 0', color: 'var(--text-tertiary)' }}>
                                        <LayoutGrid size={48} color="var(--brand-accent)" style={{ opacity: 0.2, marginBottom: '24px' }} />
                                        <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-primary)' }}>لا توجد طلبات مسجلة</div>
                                        <div style={{ fontSize: '14px', marginTop: '8px' }}>اضغط على "طلب جديد" لفتح طلب دعم فني.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sliding Detailed Context Pane */}
                    {isModalOpen && selectedTicket && (
                        <div className="neo-card scale-in" style={{ flex: 1.4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="flex-between" style={{ padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--brand-accent)', letterSpacing: '1px', marginBottom: '4px' }}>INSPECTION MODE</div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>التفاصيل السريعة</div>
                                </div>
                                <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>إخفاء اللوحة</button>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-app)' }}>
                                <TicketDetailsModal 
                                    ticket={selectedTicket} 
                                    isOpen={true} 
                                    onClose={() => setIsModalOpen(false)} 
                                    isEmbedded={true} 
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Instant Support Floating Hub */}
                <div style={{ position: 'fixed', bottom: '30px', left: '30px', zIndex: 1000 }}>
                    {isChatOpen && (
                        <div className="neo-card scale-in" style={styles.chatWindow}>
                            <div style={styles.chatHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="pulse-dot"></div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '900' }}>الدعم المباشر LITC</div>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>متصل الآن</div>
                                    </div>
                                </div>
                                <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
                            </div>
                            <div style={styles.chatBody}>
                                <div style={styles.msgBot}>مرحباً {userData?.displayName?.split(' ')[0] || 'بك'}! كيف يمكننا مساعدتك تقنياً اليوم؟ (هذا هو الدردشة السريعة خارج التذاكر)</div>
                                {chatMsgs.map(m => (
                                    <div key={m.id} style={m.type === 'user' ? styles.msgUser : styles.msgBot}>
                                        {m.text}
                                    </div>
                                ))}
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '20px' }}>الدعم المباشر متوفر 24/7</div>
                            </div>
                            <div style={styles.chatInputArea}>
                                <input 
                                    type="text" 
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendChat()}
                                    placeholder="اكتب استفسارك..." 
                                    style={styles.chatInput} 
                                />
                                <button onClick={handleSendChat} style={styles.chatSendBtn}>إرسال</button>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className="flex-center" style={styles.chatTrigger}>
                        <MessageCircle size={24} />
                        <span style={{ fontSize: '13px', fontWeight: '800' }}>الدردشة الفورية</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

const styles = {
    navBtn: {
        display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', 
        borderRadius: '12px', border: 'none', cursor: 'pointer',
        fontSize: '14px', fontWeight: '600', transition: 'all 0.2s', textAlign: 'right'
    },

    chatTrigger: { background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: '99px', padding: '12px 25px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(0, 92, 132, 0.3)', transition: '0.3s' },
    chatWindow: { position: 'absolute', bottom: '70px', left: 0, width: '320px', height: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    chatHeader: { background: 'var(--brand-blue)', color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    chatBody: { flex: 1, padding: '20px', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' },
    msgBot: { background: 'var(--bg-surface)', padding: '12px', borderRadius: '12px 12px 0 12px', fontSize: '12px', color: 'var(--text-primary)', alignSelf: 'flex-start', border: '1px solid var(--glass-border)' },
    msgUser: { background: 'var(--brand-blue)', padding: '12px', borderRadius: '12px 12px 12px 0', fontSize: '12px', color: '#fff', alignSelf: 'flex-end' },
    chatInputArea: { padding: '15px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-surface)', display: 'flex', gap: '10px' },
    chatInput: { flex: 1, padding: '10px 15px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-app)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' },
    chatSendBtn: { background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 15px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }
};

export default EmployeeDashboard;
