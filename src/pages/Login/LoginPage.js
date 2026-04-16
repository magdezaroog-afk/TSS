import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, User, Lock, Mail, 
    Zap, Terminal, Cpu, Globe, Rocket, Settings
} from 'lucide-react';

const Spline = lazy(() => import('@splinetool/react-spline'));

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [splineLoaded, setSplineLoaded] = useState(false);
    const navigate = useNavigate();
    const { bypassLogin } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير، أهلاً بك في نظام الإدارة التقنية';
        if (hour < 18) return 'مساء الخير، يرجى تسجيل الدخول للمتابعة';
        return 'طاب مساؤك، النظام في انتظار صلاحياتك';
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            const loginEmail = email.toLowerCase();
            if (loginEmail.includes('admin') || loginEmail === 'majdi.alzarrouk@litc.ly') {
                navigate('/admin');
            } else if (loginEmail.includes('it')) {
                navigate('/engineer');
            } else {
                navigate('/employee');
            }
        } catch (err) {
            setError('خطأ في البيانات؛ يرجى التحقق من صمام الإرسال وكلمة السر.');
        }
    };

    const handleQuickAccess = async (role, cName, cEmail, cUid) => {
        await bypassLogin(role, cName, cEmail, cUid);
        if(role === 'admin') navigate('/admin');
        else if(role === 'engineer') navigate('/engineer');
        else navigate('/employee');
    };

    return (
        <div style={styles.page}>
            <div style={styles.splineContainer}>
                {!splineLoaded && <div className="nebula-bg" style={{position: 'absolute', inset: 0}}></div>}
                <Suspense fallback={null}>
                    <Spline 
                        scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" 
                        onLoad={() => setSplineLoaded(true)}
                        style={{ opacity: splineLoaded ? 1 : 0, transition: 'opacity 1s ease', width: '100%', height: '100%' }}
                    />
                </Suspense>
            </div>
            
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.logoBox}><Rocket size={32} /></div>
                    <div style={styles.titleArea}>
                        <h1 style={styles.h1}>TechTrack <span>PRO</span></h1>
                        <p style={styles.p}>{getGreeting()}</p>
                    </div>
                </div>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <Mail style={styles.iIcon} size={18} />
                        <input
                            type="email"
                            placeholder="صمام الدخول (البريد الرسمي)"
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <Lock style={styles.iIcon} size={18} />
                        <input
                            type="password"
                            placeholder="كلمة السر (الرمز السري)"
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>
                    <button type="submit" style={styles.loginBtn}>
                        <ShieldCheck size={18} /> تفعيل الجلسة الأمنية
                    </button>
                </form>

                <div style={styles.experimentalSection}>
                    <div style={styles.devLabel}>الأزرار التجريبية لمستخدمي النظام (Experimental Access)</div>
                    <div style={styles.experimentalGrid}>
                        {/* الموظفين */}
                        <div className="exp-group" style={styles.expGroup}>
                            <button style={styles.mainExpBtn}><User size={18} color="#F58220" /> <span>الموظفين</span></button>
                            <div style={styles.expDropdown}>
                                <button onClick={() => handleQuickAccess('user', 'أحمد - موظف 1', 'emp1@tss.com', 'emp_1')}>موظف 1 (أحمد)</button>
                                <button onClick={() => handleQuickAccess('user', 'سارة - موظف 2', 'emp2@tss.com', 'emp_2')}>موظف 2 (سارة)</button>
                                <button onClick={() => handleQuickAccess('user', 'خالد - موظف 3', 'emp3@tss.com', 'emp_3')}>موظف 3 (خالد)</button>
                            </div>
                        </div>

                        {/* مهندس ميداني */}
                        <div className="exp-group" style={styles.expGroup}>
                            <button style={styles.mainExpBtn}><Cpu size={18} color="#10b981" /> <span>ميداني</span></button>
                            <div style={styles.expDropdown}>
                                <button onClick={() => handleQuickAccess('engineer', 'علي - ميداني 1', 'field1@tss.com', 'field_1')}>مهندس ميداني 1</button>
                                <button onClick={() => handleQuickAccess('engineer', 'عمر - ميداني 2', 'field2@tss.com', 'field_2')}>مهندس ميداني 2</button>
                                <button onClick={() => handleQuickAccess('engineer', 'أيمن - ميداني 3', 'field3@tss.com', 'field_3')}>مهندس ميداني 3</button>
                            </div>
                        </div>

                        {/* مهندس مختص */}
                        <div className="exp-group" style={styles.expGroup}>
                            <button style={styles.mainExpBtn}><Zap size={18} color="#3b82f6" /> <span>مختص</span></button>
                            <div style={styles.expDropdown}>
                                <button onClick={() => handleQuickAccess('engineer', 'مروان - مختص 1', 'senior1@tss.com', 'senior_1')}>مهندس مختص 1</button>
                                <button onClick={() => handleQuickAccess('engineer', 'هدى - مختص 2', 'senior2@tss.com', 'senior_2')}>مهندس مختص 2</button>
                                <button onClick={() => handleQuickAccess('engineer', 'سامي - مختص 3', 'senior3@tss.com', 'senior_3')}>مهندس مختص 3</button>
                            </div>
                        </div>

                        {/* رئيس فريق */}
                        <div style={styles.expGroup}>
                            <button style={styles.mainExpBtn}><Terminal size={18} color="#8b5cf6" /> <span>رئيس فريق</span></button>
                            <div style={styles.expDropdown}>
                                <button onClick={() => handleQuickAccess('engineer', 'رائد - فريق 1', 'lead1@tss.com', 'lead_1')}>رئيس فريق 1</button>
                                <button onClick={() => handleQuickAccess('engineer', 'جمال - فريق 2', 'lead2@tss.com', 'lead_2')}>رئيس فريق 2</button>
                            </div>
                        </div>

                        {/* رئيس القسم */}
                        <button onClick={() => handleQuickAccess('dept_head', 'مدير الإدارة', 'dept.head@tss.com', 'dh_main')} style={styles.soloExpBtn}>
                            <Globe size={18} color="#005C84" />
                            <span>رئيس القسم</span>
                        </button>

                        {/* مسؤول النظام */}
                        <button onClick={() => handleQuickAccess('admin', 'مسؤول النظام', 'admin@tss.com', 'admin_1')} style={{...styles.soloExpBtn, background: 'var(--brand-orange)', color: '#fff'}}>
                            <Settings size={18} color="#fff" />
                            <span>الإدارة</span>
                        </button>
                    </div>
                </div>

                <div style={styles.footer}>
                    <p style={styles.footerP}>المؤسسة الليبية للاتصالات الدولية - وحدة النظم المتقدمة</p>
                    <div style={styles.versionTag}>V3.0 - ENTERPRISE ELITE</div>
                </div>
            </div>
            <style>
                {`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(1deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .nebula-bg {
                    width: 150%; height: 150%;
                    background: radial-gradient(circle at 10% 10%, rgba(0, 92, 132, 0.05) 0%, transparent 50%),
                                radial-gradient(circle at 90% 90%, rgba(245, 130, 32, 0.05) 0%, transparent 50%);
                    animation: float 20s infinite ease-in-out;
                    z-index: 1;
                }
                .exp-group:hover .exp-dropdown {
                    display: flex !important;
                }
                .exp-dropdown button {
                    background: transparent; border: none; padding: 10px; text-align: right;
                    font-size: 11px; font-weight: 800; cursor: pointer; color: #475569;
                    border-bottom: 1px solid #f1f5f9; transition: 0.2s;
                }
                .exp-dropdown button:hover { background: #f8fafc; color: #005C84; }
                `}
            </style>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', direction: 'rtl', fontFamily: "'Cairo', sans-serif" },
    splineContainer: { position: 'absolute', inset: 0, zIndex: 0 },
    card: { width: '100%', maxWidth: '440px', background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(30px)', padding: '50px 45px', borderRadius: '45px', border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 30px 100px rgba(0, 0, 0, 0.05)', textAlign: 'center', zIndex: 10 },
    header: { marginBottom: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' },
    logoBox: { width: '65px', height: '65px', background: 'linear-gradient(135deg, #005C84, #003e5c)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 25px rgba(0,92,132,0.2)' },
    titleArea: { textAlign: 'right' },
    h1: { fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
    p: { fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginTop: '5px' },
    errorBox: { padding: '14px', borderRadius: '14px', background: '#fef2f2', color: '#ef4444', fontSize: '12px', fontWeight: '800', marginBottom: '25px', border: '1px solid rgba(239, 68, 68, 0.1)' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { position: 'relative', width: '100%' },
    iIcon: { position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
    input: { width: '100%', padding: '16px 20px 16px 50px', background: 'rgba(255,255,255,0.7)', borderRadius: '18px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' },
    loginBtn: { padding: '18px', background: 'linear-gradient(135deg, #005C84, #003e5c)', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 15px 30px rgba(0,92,132,0.2)', marginBottom: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    experimentalSection: { borderTop: '1px solid #f1f5f9', paddingTop: '30px', textAlign: 'center' },
+   devLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px', letterSpacing: '1px' },
    experimentalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    expGroup: { position: 'relative' },
    mainExpBtn: { width: '100%', background: '#fff', border: '1px solid #f1f5f9', padding: '12px 5px', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: '800', color: '#475569' },
    expDropdown: { position: 'absolute', bottom: '100%', left: 0, width: '140px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', display: 'none', flexDirection: 'column', zIndex: 100, border: '1px solid #f1f5f9', overflow: 'hidden' },
    soloExpBtn: { background: '#fff', border: '1px solid #f1f5f9', padding: '12px 5px', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: '800', color: '#475569' },
    footer: { marginTop: '40px' },
    footerP: { fontSize: '10px', color: '#94a3b8', margin: '0 0 15px 0', fontWeight: '700' },
    versionTag: { display: 'inline-block', padding: '6px 18px', background: '#f1f5f9', color: '#005C84', fontSize: '9px', fontWeight: '900', borderRadius: '50px', letterSpacing: '1px' }
};

export default LoginPage;
