import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, limit, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'react-toastify';
import {
    Settings, Users, Shield, Activity, 
    LogOut, UserPlus, Search, ShieldCheck, 
    Smartphone, Database, Globe, LifeBuoy
} from 'lucide-react';

const AdminDashboard = () => {
    const { currentUser, userData, logout } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, "users"), snap => {
            setAllUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
        });
        const unsubActivities = onSnapshot(query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(50)), snap => {
            setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubTickets = onSnapshot(query(collection(db, "tickets"), limit(100)), snap => {
            setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubUsers(); unsubActivities(); unsubTickets(); };
    }, []);

    const handleUpdateRoleExtended = async (uid, combinedValue) => {
        try {
            let role = combinedValue;
            let techLevel = 'junior';

            if (combinedValue.startsWith('eng_')) {
                role = 'engineer';
                techLevel = combinedValue.replace('eng_', '');
            }

            await updateDoc(doc(db, "users", uid), { role, techLevel });
            toast.success("تم تحديث الرتبة بنجاح");
        } catch (e) {
            toast.error("خطأ في التحديث");
        }
    };

    const handleUpdateStatus = async (uid, newStatus) => {
        try {
            await updateDoc(doc(db, "users", uid), { status: newStatus });
            toast.success("تم تحديث حالة المستخدم");
        } catch (e) {
            toast.error("إجراء غير مسموح به");
        }
    };

    const handleDeleteUser = async (uid, email) => {
        if (email === currentUser.email) return toast.error("لا يمكنك حذف حسابك الحالي");
        if (!window.confirm(`هل أنت متأكد من حذف المستخدم ${email}؟`)) return;
        try {
            await deleteDoc(doc(db, "users", uid));
            toast.success("تم حذف المستخدم من قاعدة البيانات");
        } catch (e) { toast.error("فشل الحذف؛ قد لا تملك الصلاحيات الكافية"); }
    };

    const handleReset = async () => {
        if (!window.confirm("سيقوم هذا الإجراء بتنظيف كافة الحسابات المكررة والبيانات. هل تود الاستمرار؟")) return;
        try {
            const batch = writeBatch(db);
            
            // 1. Clear Data (Tickets & Activities)
            const tSnap = await getDocs(collection(db, "tickets"));
            tSnap.forEach(d => batch.delete(d.ref));
            const aSnap = await getDocs(collection(db, "activities"));
            aSnap.forEach(d => batch.delete(d.ref));

            // 2. Aggressive User Deduplication
            const stableUsers = {
                'dev_admin': 'admin.dev@litc.ly',
                'dev_user': 'user.dev@litc.ly',
                'eng_ahmed': 'ahmed.it@litc.ly',
                'eng_salem': 'salem.it@litc.ly',
                'eng_mahmoud': 'mahmoud.it@litc.ly',
                'eng_tarek': 'tarek.it@litc.ly'
            };

            const uSnap = await getDocs(collection(db, "users"));
            uSnap.forEach(d => {
                const u = d.data();
                const uid = d.id;
                const email = u.email?.toLowerCase();

                // Keep the current session user NO MATTER WHAT to avoid crash
                if (uid === currentUser.uid) return; 

                // Check if this email belongs to a stable dev account
                const stableUidForThisEmail = Object.keys(stableUsers).find(key => stableUsers[key] === email);

                if (stableUidForThisEmail) {
                    // If this doc is NOT the stable one, delete it!
                    if (uid !== stableUidForThisEmail) {
                        batch.delete(d.ref);
                    } else {
                        // Reset the stable one to base state
                        batch.update(d.ref, { 
                            role: (uid.includes('eng_') ? 'engineer' : (uid === 'dev_admin' ? 'admin' : 'user')), 
                            status: 'active' 
                        });
                    }
                } else {
                    // For other emails, if they are duplicates or not "majdi", we can clean them
                    if (email !== 'majdi.alzarrouk@litc.ly' && email !== currentUser.email) {
                         // batch.delete(d.ref); // Uncomment if you want to wipe all other users too
                    }
                }
            });

            await batch.commit();
            toast.success("تم تنظيف المكررات وتصفير البيانات بنجاح");
        } catch (e) { 
            console.error("Cleanup Error:", e);
            toast.error("حدث خطأ أثناء التنظيف؛ يرجى المحاولة لاحقاً"); 
        }
    };

    const handleSeedUsers = async () => {
        if (!window.confirm("سيقوم هذا الإجراء بإنشاء كافة المستخدمين التجريبيين (موظف 1-3، مهندس 1-3، إلخ) في قاعدة البيانات. هل تود الاستمرار؟")) return;
        try {
            const batch = writeBatch(db);
            const demoUsers = [
                { uid: 'emp_1', email: 'emp1@tss.com', displayName: 'أحمد - موظف 1', role: 'user', status: 'active' },
                { uid: 'emp_2', email: 'emp2@tss.com', displayName: 'سارة - موظف 2', role: 'user', status: 'active' },
                { uid: 'emp_3', email: 'emp3@tss.com', displayName: 'خالد - موظف 3', role: 'user', status: 'active' },
                { uid: 'field_1', email: 'field1@tss.com', displayName: 'علي - ميداني 1', role: 'engineer', techLevel: 'junior', status: 'active' },
                { uid: 'field_2', email: 'field2@tss.com', displayName: 'عمر - ميداني 2', role: 'engineer', techLevel: 'junior', status: 'active' },
                { uid: 'field_3', email: 'field3@tss.com', displayName: 'أيمن - ميداني 3', role: 'engineer', techLevel: 'junior', status: 'active' },
                { uid: 'senior_1', email: 'senior1@tss.com', displayName: 'مروان - مختص 1', role: 'engineer', techLevel: 'senior', status: 'active' },
                { uid: 'senior_2', email: 'senior2@tss.com', displayName: 'هدى - مختص 2', role: 'engineer', techLevel: 'senior', status: 'active' },
                { uid: 'senior_3', email: 'senior3@tss.com', displayName: 'سامي - مختص 3', role: 'engineer', techLevel: 'senior', status: 'active' },
                { uid: 'lead_1', email: 'lead1@tss.com', displayName: 'رائد - فريق 1', role: 'engineer', techLevel: 'lead', status: 'active' },
                { uid: 'lead_2', email: 'lead2@tss.com', displayName: 'جمال - فريق 2', role: 'engineer', techLevel: 'lead', status: 'active' },
                { uid: 'lead_3', email: 'lead3@tss.com', displayName: 'سامر - فريق 3', role: 'engineer', techLevel: 'lead', status: 'active' },
                { uid: 'dh_main', email: 'dept.head@tss.com', displayName: 'مدير الإدارة', role: 'dept_head', status: 'active' }
            ];

            demoUsers.forEach(user => {
                const userRef = doc(db, "users", user.uid);
                batch.set(userRef, { ...user, createdAt: new Date() }, { merge: true });
            });

            await batch.commit();
            toast.success("تم توليد كافة المستخدمين التجريبيين بنجاح!");
        } catch (e) {
            toast.error("فشل توليد المستخدمين");
        }
    };

    const [sysConfig, setSysConfig] = useState({ appName: 'TechTrack LITC', logoUrl: '' });
    const handleSaveConfig = async () => {
        try {
            await updateDoc(doc(db, "settings", "general"), sysConfig);
            toast.success("تم حفظ إعدادات هويت النظام");
        } catch (e) { toast.error("فشل الحفظ؛ تأكد من صلاحيات قاعدة البيانات"); }
    };

    const filteredUsers = allUsers.filter(u => 
        (u.displayName || u.email).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={styles.page}>
            <aside style={styles.sidebar}>
                <div style={styles.logoSec}>
                    <div style={styles.logo}><Shield size={20} /></div>
                    <div>
                        <div style={styles.lMain}>TechTrack</div>
                        <div style={styles.lSub}>إدارة النظام</div>
                    </div>
                </div>

                <nav style={styles.nav}>
                    <button style={{ ...styles.navTab, ...(activeTab === 'users' ? styles.navActive : {}) }} onClick={() => setActiveTab('users')}>
                        <Users size={16} /> <span>المستخدمين</span>
                    </button>
                    <button style={{ ...styles.navTab, ...(activeTab === 'rescue' ? styles.navActive : {}) }} onClick={() => setActiveTab('rescue')}>
                        <LifeBuoy size={16} /> <span>وحدة الإنقاذ</span>
                    </button>
                    <button style={{ ...styles.navTab, ...(activeTab === 'logs' ? styles.navActive : {}) }} onClick={() => setActiveTab('logs')}>
                        <Activity size={16} /> <span>سجل النظام</span>
                    </button>
                    <button style={{ ...styles.navTab, ...(activeTab === 'config' ? styles.navActive : {}) }} onClick={() => setActiveTab('config')}>
                        <Settings size={16} /> <span>الإعدادات</span>
                    </button>
                </nav>

                <div style={styles.sideFooter}>
                    <div style={styles.uBox}>
                        <div style={styles.uChar}>A</div>
                        <div style={{overflow: 'hidden'}}>
                            <div style={styles.uName}>{userData?.displayName || 'Admin'}</div>
                            <div style={styles.uRole}>مدير النظام</div>
                        </div>
                    </div>
                    <button onClick={logout} style={styles.logoutBtn}>
                        <LogOut size={14} /> خروج آمن
                    </button>
                </div>
            </aside>

            <main style={styles.main}>
                <header style={styles.header}>
                    <h1 style={styles.h1}>وحدة التحكم الأمنية</h1>
                    <div style={styles.searchWrap}>
                        <Search size={14} style={styles.sIcon} color="#94a3b8" />
                        <input type="text" placeholder="بحث عن مستخدم..." style={styles.sInput} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </header>

                {activeTab === 'users' && (
                    <div style={styles.dashboardBody}>
                        <div style={styles.statsRow}>
                            <div style={styles.statMini}>
                                <Users size={16} />
                                <div><div style={styles.smVal}>{allUsers.length}</div><div style={styles.smLab}>إجمالي المستخدمين</div></div>
                            </div>
                            <div style={styles.statMini}>
                                <ShieldCheck size={16} />
                                <div><div style={styles.smVal}>{allUsers.filter(u=>u.role==='admin').length}</div><div style={styles.smLab}>قادة النظام</div></div>
                            </div>
                            <div style={styles.statMini}>
                                <Activity size={16} />
                                <div><div style={styles.smVal}>{activities.filter(a => new Date().getTime() - (a.timestamp?.toDate?.().getTime() || 0) < 3600000).length}</div><div style={styles.smLab}>النشاط (آخر ساعة)</div></div>
                            </div>
                        </div>

                        <div style={styles.card}>
                            <div style={styles.cardHead}>
                                <h2 style={styles.h2}>إدارة الهوية والوصول (IAM)</h2>
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <button onClick={handleReset} style={styles.btnClean} title="تنظيف كافة المكررات والبيانات القديمة">
                                        <Database size={14} /> تنظيف الحسابات 
                                    </button>
                                    <button onClick={handleSeedUsers} style={{...styles.btnPrimary, background: '#8b5cf6'}}>
                                        <UserPlus size={14} /> توليد المستخدمين التجريبيين
                                    </button>
                                    <button style={styles.btnPrimary}><UserPlus size={14} /> إضافة مستخدم</button>
                                </div>
                            </div>
                            <div style={styles.tableScroll}>
                                <div style={styles.table}>
                                    <div style={styles.tableHead}>
                                        <div style={{flex: 2}}>المستخدم</div>
                                        <div style={{flex: 1}}>الدور الحالي</div>
                                        <div style={{flex: 1}}>الحالة</div>
                                        <div style={{width: '200px'}}>الإجراءات</div>
                                    </div>
                                    {filteredUsers.map(u => (
                                        <div key={u.uid} style={styles.row}>
                                            <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <div style={styles.uCharSmall}>{u.email[0].toUpperCase()}</div>
                                                <div>
                                                    <div style={{fontWeight: '700', fontSize: '13px'}}>{u.displayName || u.email.split('@')[0]}</div>
                                                    <div style={{fontSize: '10px', color: '#64748b'}}>{u.email}</div>
                                                </div>
                                            </div>
                                            <div style={{flex: 1.5}}>
                                                <select 
                                                    value={u.role === 'engineer' ? `eng_${u.techLevel || 'junior'}` : u.role} 
                                                    onChange={(e) => handleUpdateRoleExtended(u.uid, e.target.value)}
                                                    style={styles.roleSelect}
                                                >
                                                    <option value="user">موظف / مُبلّغ (User)</option>
                                                    <option value="eng_junior">مهندس ميداني (Field Eng)</option>
                                                    <option value="eng_senior">مهندس مختص (Specialist)</option>
                                                    <option value="eng_lead">رئيس فريق (Team Lead)</option>
                                                    <option value="dept_head">رئيس قسم (Dept Head)</option>
                                                    <option value="admin">مسؤول نظام (Admin)</option>
                                                </select>
                                            </div>
                                            <div style={{flex: 1}}>
                                                <span style={{...styles.statusTag, background: u.status === 'active' ? '#dcfce7' : '#f1f5f9', color: u.status === 'active' ? '#15803d' : '#64748b'}}>
                                                    {u.status === 'active' ? 'نشط' : 'معطل'}
                                                </span>
                                            </div>
                                            <div style={{width: '200px', display: 'flex', gap: '10px'}}>
                                                <button onClick={() => handleUpdateStatus(u.uid, u.status === 'active' ? 'disabled' : 'active')} style={styles.btnAction}>
                                                    {u.status === 'active' ? 'تعطيل' : 'تفعيل'}
                                                </button>
                                                <button onClick={() => handleDeleteUser(u.uid, u.email)} style={{...styles.btnAction, color: '#ef4444'}}>حذف</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rescue' && (
                    <div style={styles.card}>
                        <div style={styles.cardHead}>
                            <h2 style={styles.h2}>وحدة التدخل والإنقاذ (Rescue Center)</h2>
                            <p style={{fontSize: '12px', color: '#64748b'}}>تعديل مسار البلاغات العالقة يدوياً</p>
                        </div>
                        <div style={styles.tableScroll}>
                            <div style={styles.table}>
                                <div style={styles.tableHead}>
                                    <div style={{flex: 1}}>رقم البلاغ</div>
                                    <div style={{flex: 2}}>العنوان</div>
                                    <div style={{flex: 1}}>الحالة الحالية</div>
                                    <div style={{width: '200px'}}>الإجراء التصحيحي</div>
                                </div>
                                {tickets.map(t => (
                                    <div key={t.id} style={styles.row}>
                                        <div style={{flex: 1, fontWeight: '700'}}>#{t.id.slice(-6).toUpperCase()}</div>
                                        <div style={{flex: 2}}>{t.subCategory || 'بلاغ بدون تفاصيل'}</div>
                                        <div style={{flex: 1}}>
                                            <span style={{color: t.status === 'مكتمل' ? '#10b981' : '#f59e0b', fontWeight: '800'}}>{t.status}</span>
                                        </div>
                                        <div style={{width: '200px', display: 'flex', gap: '10px'}}>
                                            <button onClick={() => updateDoc(doc(db, "tickets", t.id), { status: 'في الانتظار', assignedTo: null })} style={styles.btnAction}>إرجاع للطابور</button>
                                            <button onClick={() => deleteDoc(doc(db, "tickets", t.id))} style={{...styles.btnAction, color: '#ef4444'}}>حذف نهائي</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div style={styles.card}>
                        <h2 style={styles.h2}>سجل الرقابة الأمنية (Security Audit)</h2>
                        <div style={styles.logsContainer}>
                            {activities.map(act => (
                                <div key={act.id} style={styles.logItem}>
                                    <div style={styles.logTag}>AUDIT</div>
                                    <div style={styles.logBody}>
                                        <span style={{fontWeight: '800', color: '#1e293b'}}>{act.user}</span>
                                        <span style={{color: '#475569'}}> {act.action}</span>
                                    </div>
                                    <div style={styles.logTime}>
                                        {act.timestamp?.toDate ? new Date(act.timestamp.toDate()).toLocaleString('ar-LY') : 'منذ قليل'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div style={styles.configLayout}>
                        <div style={styles.configSection}>
                            <div style={styles.cardHead}>
                                <h3 style={styles.h2}><Globe size={18} /> هوية النظام (Corporate Branding)</h3>
                            </div>
                            <div style={styles.configBox}>
                                <div style={styles.field}>
                                    <label style={styles.label}>اسم المنظومة المعتمد</label>
                                    <input type="text" value={sysConfig.appName} onChange={e => setSysConfig({...sysConfig, appName: e.target.value})} style={styles.input} />
                                </div>
                                <div style={styles.field}>
                                    <label style={styles.label}>شعار المنظومة (URL)</label>
                                    <input type="text" value={sysConfig.logoUrl} placeholder="رابط صورة اللوجو..." onChange={e => setSysConfig({...sysConfig, logoUrl: e.target.value})} style={styles.input} />
                                </div>
                                <button onClick={handleSaveConfig} style={styles.btnPrimary}>حفظ التغييرات</button>
                            </div>
                        </div>

                        <div style={styles.configGrid}>
                            <div style={styles.configCard}>
                                <Smartphone size={24} color="var(--brand-blue)" />
                                <h3>تكامل الموبايل</h3>
                                <p style={{fontSize: '11px'}}>إعدادات الربط مع تطبيقات الأندرويد و iOS</p>
                            </div>
                            <div style={styles.configCard}>
                                <Database size={24} color="var(--state-danger-text)" />
                                <h3 style={{color: 'var(--state-danger-text)'}}>تصفير المنظومة الكلي</h3>
                                <p style={{fontSize: '11px'}}>مسح كافة البلاغات والنشاطات وإرجاع كافة المستخدمين لموظفين عاديين (User)</p>
                                <button onClick={handleReset} style={styles.btnDanger}>بدء التصفير</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const styles = {
    page: { display: 'flex', minHeight: '100vh', background: 'var(--bg-app)', direction: 'rtl', fontFamily: "'Cairo', 'Outfit', sans-serif" },
    sidebar: { width: '270px', background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--glass-border)', padding: '30px 20px', display: 'flex', flexDirection: 'column', backdropFilter: 'var(--glass-blur)' },
    logoSec: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' },
    logo: { width: '40px', height: '40px', background: 'var(--brand-blue)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
    lMain: { fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' },
    lSub: { fontSize: '11px', color: 'var(--text-tertiary)' },
    nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
    navActive: { background: 'var(--glass-border)', color: 'var(--brand-blue)' },
    sideFooter: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' },
    uBox: { display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-app)', padding: '10px', borderRadius: '12px', marginBottom: '15px' },
    uChar: { width: '32px', height: '32px', background: 'var(--brand-blue)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' },
    uName: { fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' },
    uRole: { fontSize: '11px', color: 'var(--text-tertiary)' },
    logoutBtn: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--state-danger-bg)', background: 'transparent', color: 'var(--state-danger-text)', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' },
    main: { flex: 1, padding: '40px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    h1: { fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)' },
    searchWrap: { position: 'relative', width: '300px' },
    sIcon: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' },
    sInput: { width: '100%', padding: '10px 15px 10px 45px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '10px', outline: 'none', color: 'var(--text-primary)' },
    card: { background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', padding: '30px', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)', boxShadow: 'var(--shadow-card)' },
    cardHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    h2: { fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)' },
    btnPrimary: { background: 'var(--brand-blue)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    btnClean: { background: 'var(--brand-orange)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    table: { display: 'flex', flexDirection: 'column' },
    tableScroll: { maxHeight: '600px', overflowY: 'auto', paddingLeft: '10px' },
    tableHead: { display: 'flex', padding: '10px 20px', background: 'var(--bg-app)', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: 'var(--text-tertiary)', marginBottom: '10px' },
    row: { display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)' },
    uCharSmall: { width: '28px', height: '28px', background: 'var(--brand-blue)', color: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '12px' },
    roleSelect: { padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '12px', fontWeight: '800', background: 'var(--bg-app)', color: 'var(--text-primary)' },
    statusTag: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
    btnAction: { background: 'var(--bg-app)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
    btnDanger: { background: 'transparent', border: '1px solid var(--state-danger-bg)', borderRadius: '10px', padding: '10px 20px', color: 'var(--state-danger-text)', fontWeight: '900', cursor: 'pointer', marginTop: '10px' },
    dashboardBody: { display: 'flex', flexDirection: 'column', gap: '25px' },
    statsRow: { display: 'flex', gap: '20px' },
    statMini: { flex: 1, background: 'var(--bg-surface)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-card)', backdropFilter: 'var(--glass-blur)' },
    smVal: { fontSize: '24px', fontWeight: '900', color: 'var(--brand-blue)' },
    smLab: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800' },
    logsContainer: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' },
    logItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--glass-border)' },
    logTag: { background: 'var(--brand-blue)', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px' },
    logBody: { flex: 1, color: 'var(--text-secondary)', fontSize: '13px' },
    logTime: { fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '800' },
    configLayout: { display: 'flex', flexDirection: 'column', gap: '30px' },
    configSection: { background: 'var(--bg-surface)', padding: '30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)' },
    configBox: { display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginTop: '20px' },
    field: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '250px' },
    label: { fontSize: '12px', fontWeight: '900', color: 'var(--text-secondary)' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', fontWeight: '800' },
    configGrid: { display: 'flex', gap: '20px' },
    configCard: { flex: 1, background: 'var(--bg-surface)', padding: '25px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', backdropFilter: 'var(--glass-blur)' }
};

export default AdminDashboard;
