import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    FaPhoneAlt, FaPrint, FaNetworkWired, FaDesktop, FaChevronDown, 
    FaExclamationCircle, FaUserCircle, FaBuilding, FaArrowRight, FaCheckCircle,
    FaEnvelope, FaUserShield, FaHdd, FaFileImport, FaUpload, FaTimes, FaMapMarkerAlt, FaBriefcase, FaBolt
} from 'react-icons/fa';

const buildings = ['كم4', 'مبنى الشط', 'مبنى السياحية', 'محطة تاجوراء', 'محطة درنة', 'محطة مصراته', 'شارع الزاوية'];
const departments = [
    'مكتب المدير العام', 'مكتب مجلس الإدارة', 'الإدارة التجارية', 'الإدارة المالية',
    'ادارة تقنية المعلومات', 'ادارة الموارد البشرية', 'ادارة المشتريات والخدمات',
    'مكتب المستشارين', 'الإدارة الفنية', 'مكتب المراجعة الداخلية',
    'مكتب الامن السيبراني', 'مكتب الجودة', 'ادارة المخاطر'
];

const categories = [
    { id: 'phones', name: 'خدمات الهواتف / IP Phone', icon: <FaPhoneAlt />, color: '#005C84', sub: ['إعداد رقم جديد', 'عطل في السماعة', 'مشكلة في التوصيل', 'تحديث دليل الهاتف', 'أخرى...'] },
    { id: 'printers', name: 'الطابعات والماسحات', icon: <FaPrint />, color: '#F58220', sub: ['تبديل حبر', 'انحشار ورق', 'تعريف طابعة', 'إعداد المسح الضوئي', 'أخرى...'] },
    { id: 'network', name: 'الشبكة والإنترنت والـ WiFi', icon: <FaNetworkWired />, color: '#0ea5e9', sub: ['انقطاع الإنترنت', 'مشكلة في الكابل', 'طلب نقطة جديدة', 'إعداد VPN', 'أخرى...'] },
    { id: 'email_systems', name: 'البريد الإلكتروني والأنظمة', icon: <FaEnvelope />, color: '#8b5cf6', sub: ['نسيان كلمة السر', 'مشكلة في Outlook', 'إضافة بريد جديد', 'خطأ في نظام المراسلات', 'أخرى...'] },
    { id: 'security', name: 'الأمن السيبراني والصلاحيات', icon: <FaUserShield />, color: '#ef4444', sub: ['طلب صلاحية دخول', 'بلاغ عن اختراق/فيروس', 'تفعيل بطاقة الموظف', 'مدير المهام', 'أخرى...'] },
    { id: 'hardware', name: 'أجهزة الكمبيوتر والقطع', icon: <FaHdd />, color: '#64748b', sub: ['بطء الجهاز', 'عطل في الشاشة', 'توفير كيبورد/ماوس', 'ترقية الرامات/الهارد', 'أخرى...'] },
    { id: 'office_tools', name: 'تطبيقات الأوفيس والبرامج', icon: <FaDesktop />, color: '#10b981', sub: ['تفعيل ويندوز/أوفيس', 'تنصيب برنامج متخصص', 'مشكلة في Excel/Word', 'تحديث برامج الحماية', 'أخرى...'] },
    { id: 'admin_req', name: 'طلبات تقنية إضافية', icon: <FaFileImport />, color: '#d946ef', sub: ['نقل جهاز لمكتب آخر', 'جرد أصول تقنية', 'طلب استعارة لابتوب', 'أخرى...'] }
];

const urgencies = [
    { id: 'low', label: 'عادي', color: 'var(--state-success-text)', desc: 'STABLE', h: '60px' },
    { id: 'medium', label: 'متوسط', color: 'var(--brand-orange)', desc: 'ACTIVE', h: '80px' },
    { id: 'high', label: 'حرج', color: 'var(--state-danger-text)', desc: 'CRITICAL', h: '100px' }
];

const CreateTicket = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ 
        category: '', subCategory: '', urgency: 'low', 
        description: '', building: '', department: '' 
    });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePicker, setActivePicker] = useState(null);
    const submittedRef = useRef(false); // BUG-09 Fix: prevent double submission

    // UI-07 Fix: Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.picker-container')) {
                setActivePicker(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser?.uid) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) setUserData(userDoc.data());
            }
        };
        fetchUserData();
    }, [currentUser]);

    const isFormValid = () => {
        const basics = selection.category && selection.subCategory && selection.building && selection.department;
        const otherRule = selection.subCategory === 'أخرى...' ? !!selection.description.trim() : true;
        return basics && otherRule;
    };

    const handleSubmit = async () => {
        if (!isFormValid() || isSubmitting || submittedRef.current) return;
        submittedRef.current = true; // Lock immediately
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "tickets"), {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                userName: userData?.displayName || currentUser.email.split('@')[0],
                category: selection.category,
                subCategory: selection.subCategory,
                description: selection.description || 'بلا وصف فني متاح',
                urgency: selection.urgency,
                building: selection.building,
                targetDepartment: selection.department,
                hasAttachment: !!file,
                attachmentName: file ? file.name : null,
                status: 'قيد الانتظار',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                comments: []
            });
            navigate('/employee');
        } catch (e) {
            console.error(e);
            submittedRef.current = false; // Release lock on error
        }
        finally { setIsSubmitting(false); }
    };

    const selectedCategory = categories.find(c => c.id === selection.category);

    const MagneticPicker = ({ label, icon, options, value, onSelect, id }) => {
        const isOpen = activePicker === id;
        return (
            <div style={styles.pickerCont} className="picker-container">
                <label style={styles.fieldLabel}>{icon} {label}</label>
                <div 
                    onClick={() => setActivePicker(isOpen ? null : id)}
                    style={{ ...styles.trigger, borderColor: isOpen ? 'var(--brand-blue)' : 'var(--glass-border)' }}
                >
                    <span style={{ fontWeight: '900' }}>{value || '-- اضغط لاختيار الخيار --'}</span>
                    <FaChevronDown style={{ ...styles.chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </div>

                {isOpen && (
                    <div style={styles.waveOverlay}>
                        <div style={styles.waveScroll}>
                            {options.map((opt, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => { onSelect(opt); setActivePicker(null); }}
                                    className="wave-item"
                                    style={{ animationDelay: `${idx * 0.03}s` }}
                                >
                                    <div style={styles.indicator}></div>
                                    <span>{opt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={styles.page}>
            <style>
                {`
                @keyframes waveIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes criticalPulse { 0% { transform: scale(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); } 50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(239, 68, 68, 0.7); } 100% { transform: scale(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); } }
                .wave-item { padding: 18px 25px; margin: 8px 0; background: var(--bg-surface); border-radius: 18px; border: 1px solid var(--glass-border); cursor: pointer; transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); font-weight: bold; display: flex; align-items: center; gap: 15px; animation: waveIn 0.3s ease forwards; color: var(--text-primary); }
                .wave-item:hover { background: var(--brand-blue); color: #fff; transform: scale(1.05) translateX(-10px); z-index: 10; }
                .energy-pillar { transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); cursor: pointer; }
                .energy-pillar:hover { transform: translateY(-10px); }
                .critical-active { animation: criticalPulse 1s infinite alternate; }
                `}
            </style>

            <div style={styles.glow1}></div>
            <div style={styles.glow2}></div>

            <div style={styles.container}>
                <header style={styles.header}>
                    <div style={styles.brand}>
                        <div style={styles.logo}>L</div>
                        <span style={styles.brandTxt}>LITC TechTrack</span>
                    </div>
                    <button onClick={() => navigate('/employee')} style={styles.closeBtn}><FaTimes /></button>
                </header>

                <main style={styles.mainSlab}>
                    {step === 1 ? (
                        <div style={styles.frame}>
                            <div style={styles.intro}>
                                <div style={styles.tag}>نظام الدعم الفني الحديث</div>
                                <h1 style={styles.h1}>تحديد اتجاه الإشارة</h1>
                            </div>
                            <div style={styles.grid}>
                                {categories.map(cat => (
                                    <button key={cat.id} onClick={() => { setSelection({...selection, category: cat.id}); setStep(2); }} style={{ ...styles.catCard, borderTop: `4px solid ${cat.color}` }}>
                                        <div style={{ ...styles.iconBox, background: `${cat.color}10`, color: cat.color }}>{cat.icon}</div>
                                        <span style={styles.catLabel}>{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={styles.frame}>
                            <div style={styles.slabHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ ...styles.hIcon, color: selectedCategory?.color }}>{selectedCategory?.icon}</div>
                                    <h2 style={styles.hTitle}>{selectedCategory?.name}</h2>
                                </div>
                                <button onClick={() => setStep(1)} style={styles.backBtn}>تغيير القسم</button>
                            </div>

                            <div style={styles.formGrid}>
                                <MagneticPicker label="موقع المبنى" icon={<FaMapMarkerAlt />} options={buildings} value={selection.building} onSelect={(v) => setSelection({...selection, building: v})} id="building" />
                                <MagneticPicker label="الإدارة المعنية" icon={<FaBriefcase />} options={departments} value={selection.department} onSelect={(v) => setSelection({...selection, department: v})} id="department" />
                            </div>

                            <MagneticPicker label="طبيعة العطل الفني" icon={<FaExclamationCircle />} options={selectedCategory?.sub || []} value={selection.subCategory} onSelect={(v) => setSelection({...selection, subCategory: v})} id="sub" />

                            <div style={styles.field}>
                                <label style={styles.label}>شرح الحالة {selection.subCategory === 'أخرى...' && <em style={{ color: '#ef4444' }}>(مطلوب)</em>}</label>
                                <textarea style={styles.textarea} placeholder={selection.subCategory === 'أخرى...' ? "يرجى كتابة التفاصيل هنا بدقة..." : "وصف اختياري..."} value={selection.description} onChange={(e) => setSelection({...selection, description: e.target.value})} />
                            </div>

                            <div style={styles.urgencySection}>
                                <label style={styles.label}><FaBolt /> شدة إشارة الأولوية</label>
                                <div style={styles.pillarsContainer}>
                                    {urgencies.map(u => {
                                        const isActive = selection.urgency === u.id;
                                        return (
                                            <div 
                                                key={u.id}
                                                onClick={() => setSelection({...selection, urgency: u.id})}
                                                style={{ 
                                                    ...styles.pillar, 
                                                    height: u.h, 
                                                    background: isActive ? u.color : 'rgba(255,255,255,0.4)',
                                                    boxShadow: isActive ? `0 10px 40px ${u.color}60` : 'none',
                                                    border: `1px solid ${isActive ? u.color : 'rgba(0,0,0,0.05)'}`,
                                                }}
                                                className={`energy-pillar ${isActive && u.id === 'high' ? 'critical-active' : ''}`}
                                            >
                                                <span style={{ ...styles.pLabel, color: isActive ? '#fff' : '#64748b' }}>{u.label}</span>
                                                <span style={{ ...styles.pDesc, color: isActive ? '#fff' : '#94a3b8' }}>{u.desc}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={styles.botRow}>
                                <div style={styles.fileBox}>
                                    <input type="file" id="up" hidden onChange={(e) => setFile(e.target.files[0])} />
                                    <label htmlFor="up" style={{ ...styles.fileLab, color: file ? '#10b981' : '#1e293b', borderColor: file ? '#10b981' : '#e2e8f0' }}>
                                        <FaUpload /> {file ? 'تم الإرفاق' : 'إرفاق وثيقة فنية'}
                                    </label>
                                </div>
                            </div>

                            <button onClick={handleSubmit} disabled={isSubmitting || !isFormValid()} style={{ ...styles.sendBtn, opacity: (!isFormValid() || isSubmitting) ? 0.4 : 1, transform: isSubmitting ? 'scale(0.98)' : 'scale(1)' }}>
                                {isSubmitting ? 'جاري مزامنة الإشارة...' : 'إرسال البلاغ فوراً'}
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: 'var(--bg-app)', position: 'relative', overflow: 'hidden', padding: '60px 0', direction: 'rtl', fontFamily: "'Cairo', sans-serif" },
    glow1: { position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0, 92, 132, 0.1) 0%, transparent 70%)' },
    glow2: { position: 'absolute', bottom: '-15%', right: '-10%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(245, 130, 32, 0.08) 0%, transparent 70%)' },
    container: { maxWidth: '950px', margin: '0 auto', padding: '0 25px', position: 'relative', zIndex: 10 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' },
    brand: { display: 'flex', alignItems: 'center', gap: '15px' },
    logo: { width: '45px', height: '45px', background: 'linear-gradient(135deg, #005C84, #002e42)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', fontWeight: '900' },
    brandTxt: { fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)' },
    closeBtn: { width: '45px', height: '45px', borderRadius: '14px', background: 'var(--bg-surface)', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer', boxShadow: 'var(--shadow-card)' },
    mainSlab: { background: 'var(--bg-surface)', backdropFilter: 'var(--glass-blur)', borderRadius: '45px', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-card)', padding: '60px' },
    frame: { display: 'flex', flexDirection: 'column', gap: '35px' },
    intro: { textAlign: 'center' },
    tag: { background: 'rgba(0, 92, 132, 0.1)', color: '#005C84', padding: '6px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: '900', display: 'inline-block', marginBottom: '15px' },
    h1: { fontSize: '36px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 },
    catCard: { padding: '30px 20px', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', borderRadius: '30px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', cursor: 'pointer', transition: '0.3s' },
    iconBox: { width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' },
    catLabel: { fontWeight: '900', color: 'var(--text-primary)', fontSize: '12px', textAlign: 'center' },
    slabHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '30px', borderBottom: '1px solid #f1f5f9' },
    hIcon: { fontSize: '32px' },
    hTitle: { fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 },
    backBtn: { background: 'none', border: 'none', color: 'var(--brand-blue)', fontWeight: 'bold', cursor: 'pointer' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
    pickerCont: { position: 'relative', display: 'flex', flexDirection: 'column', gap: '15px' },
    label: { fontSize: '15px', fontWeight: '900', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
    trigger: { padding: '20px 25px', background: 'var(--bg-app)', borderRadius: '20px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: '0.2s', fontWeight: 'bold', color: 'var(--text-primary)' },
    chevron: { color: '#005C84', transition: '0.4s' },
    waveOverlay: { position: 'absolute', top: '105%', left: 0, width: '100%', zIndex: 1000 },
    waveScroll: { maxHeight: '300px', overflowY: 'auto' },
    indicator: { width: '8px', height: '8px', borderRadius: '50%', background: '#F58220', opacity: 0.5 },
    field: { display: 'flex', flexDirection: 'column', gap: '10px' },
    textarea: { padding: '25px', borderRadius: '30px', background: 'var(--bg-app)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', minHeight: '140px', resize: 'none', outline: 'none', fontSize: '15px' },
    urgencySection: { display: 'flex', flexDirection: 'column', gap: '15px' },
    pillarsContainer: { display: 'flex', gap: '20px', alignItems: 'flex-end', padding: '20px 0' },
    pillar: { flex: 1, borderRadius: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.5s' },
    pLabel: { fontSize: '16px', fontWeight: '900' },
    pDesc: { fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px' },
    botRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px' },
    fileLab: { padding: '14px 28px', borderRadius: '50px', border: '2px solid', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' },
    sendBtn: { width: '100%', padding: '25px', background: 'linear-gradient(135deg, var(--brand-blue), #002e42)', color: '#fff', border: 'none', borderRadius: '35px', fontSize: '20px', fontWeight: '900', boxShadow: '0 20px 50px rgba(0,92,132,0.2)', cursor: 'pointer' }
};

export default CreateTicket;
