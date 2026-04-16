import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, User, Lock, Mail, 
    Zap, Terminal, Cpu, Globe, Rocket
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

                <div style={styles.devEntrySection}>
                    <div style={styles.devLabel}>بوابة الوصول السريع (بوابة المطورين)</div>
                    <div style={styles.devGrid}>
                        <button onClick={() => handleQuickAccess('admin')} style={styles.devBtn}>
                            <ShieldCheck size={20} color="#005C84" />
                            <span>المسؤول</span>
                        </button>
                        <button onClick={() => handleQuickAccess('user')} style={styles.devBtn}>
                            <User size={20} color="#F58220" />
                            <span>الموظف</span>
                        </button>
                        <button onClick={() => handleQuickAccess('engineer', 'المهندس سالم', 'salem.it@litc.ly', 'eng_salem')} style={styles.devBtn}>
                            <Cpu size={20} color="#10b981" />
                            <span>المهندس</span>
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
    devEntrySection: { borderTop: '1px solid #f1f5f9', paddingTop: '30px', textAlign: 'center' },
    devLabel: { fontSize: '10px', fontWeight: '900', color: '#94a3b8', marginBottom: '20px', letterSpacing: '1px' },
    devGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
    devBtn: { background: '#fff', border: '1px solid #f1f5f9', padding: '15px 10px', borderRadius: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.3s', fontSize: '11px', fontWeight: '800', color: '#475569' },
    footer: { marginTop: '40px' },
    footerP: { fontSize: '10px', color: '#94a3b8', margin: '0 0 15px 0', fontWeight: '700' },
    versionTag: { display: 'inline-block', padding: '6px 18px', background: '#f1f5f9', color: '#005C84', fontSize: '9px', fontWeight: '900', borderRadius: '50px', letterSpacing: '1px' }
};

export default LoginPage;
