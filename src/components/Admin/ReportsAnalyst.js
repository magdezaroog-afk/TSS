import React, { useState, useMemo } from 'react';
import { 
    BarChart3, Trophy, Printer, ArrowUp, ArrowDown, 
    Medal, Repeat, Settings, PieChart, Bot, 
    Search, Zap, Sparkles, LayoutPanelLeft, Clock
} from 'lucide-react';

// ==========================================
// PURE SVG CHARTS - MINIMALIST REDESIGN
// ==========================================
const DonutChart = ({ percentage, color, label, size = 110 }) => {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
        <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
            <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>{percentage}%</span>
                {label && <span style={{ fontSize: '10px', color: '#64748b', marginTop: '-2px', fontWeight: '600' }}>{label}</span>}
            </div>
        </div>
    );
};

const CustomBarChart = ({ data, maxVal, color1, color2 }) => {
    const mVal = maxVal || Math.max(...data.map(d => Math.max(d.val1 || 0, d.val2 || 0)), 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '30px', height: '180px', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
            {data.map((item, idx) => {
                const h1 = ((item.val1 || 0) / mVal) * 100;
                const h2 = ((item.val2 || 0) / mVal) * 100;
                return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100%', width: '40px' }}>
                            <div style={{ width: '18px', height: `${h1}%`, background: color1, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 1s ease' }}>
                                <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', color: '#475569', fontSize: '12px', fontWeight: '700' }}>{item.val1}</span>
                            </div>
                            {item.val2 !== undefined && (
                                <div style={{ width: '18px', height: `${h2}%`, background: color2, borderRadius: '4px 4px 0 0', position: 'relative', transition: 'height 1s ease 0.2s' }}>
                                    <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', color: '#475569', fontSize: '12px', fontWeight: '700' }}>{item.val2}</span>
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: '12px', color: '#64748b', fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>{item.label}</div>
                    </div>
                )
            })}
        </div>
    )
}

const ReportsAnalyst = ({ tickets, engineers, onDrillDown }) => {
    const [viewMode, setViewMode] = useState('ai_hybrid');

    const bOptions = [...new Set(tickets.map(t => t.building).filter(Boolean))];
    const catOptions = [...new Set(tickets.map(t => t.category).filter(Boolean))];

    const getClosingTimeHrs = (t) => {
        if (!t.createdAt || !t.updatedAt || (t.status !== 'مكتمل' && t.status !== 'Closed')) return null;
        const cDate = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
        const uDate = t.updatedAt.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
        return Math.max(0, (uDate - cDate) / (1000 * 60 * 60)); 
    };

    const isWithinExactDate = (t, dFrom, dTo) => {
        if (!t.createdAt || (!dFrom && !dTo)) return true;
        const cDate = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
        cDate.setHours(0,0,0,0);
        let inRange = true;
        if (dFrom) { const fd = new Date(dFrom); fd.setHours(0,0,0,0); if (cDate < fd) inRange = false; }
        if (dTo) { const td = new Date(dTo); td.setHours(23,59,59,999); if (cDate > td) inRange = false; }
        return inRange;
    };

    const [aiQuery, setAiQuery] = useState('');
    const [isAiJudging, setIsAiJudging] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    const handleAiSubmit = () => {
        if (!aiQuery.trim()) return;
        setIsAiJudging(true);
        setAiResult(null);

        setTimeout(() => {
            const q = aiQuery.toLowerCase();
            const matchedEngs = engineers.filter(e => e.displayName && q.includes(e.displayName.toLowerCase().split(' ')[0]));
            const matchedBuildings = bOptions.filter(b => b && q.includes(b.toLowerCase()));
            
            let matchedCat = null;
            catOptions.forEach(c => { if(q.includes(c.toLowerCase())) matchedCat = c; });

            let groupIntent = 'categories';
            let groupTitle = 'تحليل الأقسام الأساسية';
            
            if (matchedBuildings.length > 0) { groupIntent = 'buildings'; groupTitle = 'مقارنة الفروع'; }
            else if (matchedEngs.length > 0) { groupIntent = 'engineers'; groupTitle = 'أداء المهندسين'; }

            const targetList = tickets.filter(t => matchedCat ? t.category === matchedCat : true);
            let uniqueKeys = groupIntent === 'buildings' ? bOptions : groupIntent === 'engineers' ? engineers.map(e => e.email) : catOptions;

            const results = uniqueKeys.map(key => {
                const groupTickets = targetList.filter(t => {
                    if (groupIntent === 'buildings') return t.building === key;
                    if (groupIntent === 'engineers') return t.assignedTo === key;
                    return t.category === key;
                });
                const resolved = groupTickets.filter(t => t.status === 'مكتمل' || t.status === 'Closed');
                let totalHrs = 0;
                resolved.forEach(t => { const h = getClosingTimeHrs(t); if(h !== null) totalHrs += h; });
                const avgHrs = resolved.length > 0 ? (totalHrs / resolved.length) : 0;
                const dName = groupIntent === 'engineers' ? engineers.find(e => e.email === key)?.displayName || key.split('@')[0] : key;

                return { name: dName, resolved: resolved.length, avgHrs: avgHrs.toFixed(1), total: groupTickets.length };
            }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);

            setAiResult({ grouping: groupTitle, data: results });
            setIsAiJudging(false);
        }, 1200); 
    };

    const defaultCtx = { dateFrom: '', dateTo: '', engineer: 'all', category: 'all', building: 'all', title: '' };
    const [ctxA, setCtxA] = useState({ ...defaultCtx, title: 'عينة التحليل الأولى' });
    const [ctxB, setCtxB] = useState({ ...defaultCtx, title: 'عينة التحليل الثانية' });

    const getCtxStats = (ctx) => {
        const matching = tickets.filter(t => {
            if (!isWithinExactDate(t, ctx.dateFrom, ctx.dateTo)) return false;
            if (ctx.engineer !== 'all' && t.assignedTo !== ctx.engineer) return false;
            if (ctx.category !== 'all' && t.category !== ctx.category) return false;
            if (ctx.building !== 'all' && t.building !== ctx.building) return false;
            return true;
        });

        const resolved = matching.filter(t => t.status === 'مكتمل' || t.status === 'Closed');
        let totalHrs = 0; 
        resolved.forEach(t => { const hrs = getClosingTimeHrs(t); if(hrs !== null) totalHrs += hrs; });

        return {
            total: matching.length,
            resolved: resolved.length,
            avgHrs: resolved.length > 0 ? (totalHrs / resolved.length).toFixed(1) : 0,
            completionRate: matching.length > 0 ? Math.round((resolved.length / matching.length) * 100) : 0
        };
    };

    const statsA = useMemo(() => getCtxStats(ctxA), [tickets, ctxA]);
    const statsB = useMemo(() => getCtxStats(ctxB), [tickets, ctxB]);

    const leaderboardData = useMemo(() => {
        if (!engineers || engineers.length === 0) return [];
        return engineers.map(eng => {
            const engTickets = tickets.filter(t => t.assignedTo === eng.email);
            const resolved = engTickets.filter(t => t.status === 'مكتمل' || t.status === 'Closed');
            let totalHrs = 0;
            resolved.forEach(t => { const h = getClosingTimeHrs(t); if (h !== null) totalHrs += h; });
            const avgHrs = resolved.length > 0 ? (totalHrs / resolved.length) : 0;
            const score = (resolved.length * 10) + (engTickets.filter(t => t.urgency === 'high').length * 15);
            return {
                ...eng,
                resolved: resolved.length,
                avgHrs: avgHrs.toFixed(1),
                score: Math.floor(score) 
            };
        }).filter(e => e.resolved > 0).sort((a, b) => b.score - a.score);
    }, [tickets, engineers]);

    const primaryColor = '#005C84';
    const secondaryColor = '#059669';

    const renderCtxFilters = (ctx, setCtx, colorCode) => (
        <div style={{ flex: 1, background: '#fff', border: `1px solid #f1f5f9`, borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" value={ctx.title} onChange={e => setCtx({...ctx, title: e.target.value})} style={{ width: '100%', padding: '10px', background: '#f8fafc', border: 'none', borderBottom: `2px solid ${colorCode}`, borderRadius: '8px 8px 0 0', color: colorCode, fontSize: '15px', fontWeight: '800', textAlign: 'center' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                <div style={{flex:1}}><label style={styles.fLabel}>من</label><input type="date" style={styles.fSelect} value={ctx.dateFrom} onChange={e => setCtx({...ctx, dateFrom: e.target.value})}/></div>
                <div style={{flex:1}}><label style={styles.fLabel}>إلى</label><input type="date" style={styles.fSelect} value={ctx.dateTo} onChange={e => setCtx({...ctx, dateTo: e.target.value})}/></div>
            </div>
            <select value={ctx.engineer} onChange={e => setCtx({...ctx, engineer: e.target.value})} style={styles.fSelect}><option value="all">كل المهندسين</option>{engineers.map(e => <option key={e.email} value={e.email}>{e.displayName || e.email}</option>)}</select>
            <div style={{ display: 'flex', gap: '8px' }}>
                <select value={ctx.category} onChange={e => setCtx({...ctx, category: e.target.value})} style={styles.fSelect}><option value="all">الأقسام</option>{catOptions.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select value={ctx.building} onChange={e => setCtx({...ctx, building: e.target.value})} style={styles.fSelect}><option value="all">المباني</option>{bOptions.map(b => <option key={b} value={b}>{b}</option>)}</select>
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '22px', display: 'flex', alignItems: 'center', fontWeight: '800', gap: '10px' }}>
                        <LayoutPanelLeft size={24} color={primaryColor} /> مركز الرؤية التحليلية
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>أدوات الذكاء الإداري وقياس الأداء لشركة LITC</p>
                </div>
                <button className="no-print" onClick={() => window.print()} style={styles.printBtn}><Printer size={16} /> طباعة التقرير</button>
            </div>

            <div style={styles.tabsContainer} className="no-print">
                <button onClick={() => setViewMode('ai_hybrid')} style={{ ...styles.tab, ...(viewMode === 'ai_hybrid' ? styles.tabActive : {}) }}>
                    <Bot size={18} /> المساعد الذكي
                </button>
                <button onClick={() => setViewMode('ab_testing_engine')} style={{ ...styles.tab, ...(viewMode === 'ab_testing_engine' ? styles.tabActive : {}) }}>
                    <Repeat size={18} /> مقارنة العينات
                </button>
                <button onClick={() => setViewMode('advanced_leaderboard')} style={{ ...styles.tab, ...(viewMode === 'advanced_leaderboard' ? styles.tabActive : {}) }}>
                    <Trophy size={18} /> لوحة الصدارة
                </button>
            </div>

            {viewMode === 'ai_hybrid' && (
                <div style={styles.aiPanel}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <div style={styles.botIcon}><Sparkles size={24} color="#fff" /></div>
                        <textarea 
                            value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                            placeholder='اطلب تحليلاً معيناً... (مثلاً: مشاكل الإنترنت في الفرع الرئيسي)'
                            style={styles.aiInput}
                        />
                    </div>
                    <button onClick={handleAiSubmit} style={styles.aiBtn}>
                        {isAiJudging ? 'جاري التحليل...' : 'توليد البيانات الآن'} <Zap size={14} />
                    </button>

                    {aiResult && !isAiJudging && (
                        <div style={styles.aiResultsBox}>
                            <h4 style={styles.resTitle}>نتائج تحليل: {aiResult.grouping}</h4>
                            <div style={styles.resGrid}>
                                {aiResult.data.map((res, i) => (
                                    <div key={i} onClick={() => onDrillDown('الكل', res.name)} style={{...styles.resCard, cursor: 'pointer'}}>
                                        <div style={styles.resName}>{res.name}</div>
                                        <div style={styles.resStats}>
                                            <div style={{textAlign: 'center'}}><div style={styles.resVal}>{res.total}</div><div style={styles.resLab}>بلاغ</div></div>
                                            <div style={{textAlign: 'center'}}><div style={{...styles.resVal, color: '#059669'}}>{res.resolved}</div><div style={styles.resLab}>منجز</div></div>
                                            <div style={{textAlign: 'center'}}><div style={{...styles.resVal, color: '#f59e0b'}}>{res.avgHrs}س</div><div style={styles.resLab}>السرعة</div></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'ab_testing_engine' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {renderCtxFilters(ctxA, setCtxA, primaryColor)}
                        {renderCtxFilters(ctxB, setCtxB, '#d97706')}
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div onClick={() => onDrillDown('الكل', ctxA.title === defaultCtx.title ? '' : ctxA.title)} style={{...styles.comparePanel, borderTop: `4px solid ${primaryColor}`, cursor: 'pointer'}}>
                            <DonutChart percentage={statsA.completionRate} color={primaryColor} label="إغلاق التذاكر" />
                            <div style={styles.compStats}>
                                <div style={styles.compRow}><span>إجمالي البلاغات</span> <b>{statsA.total}</b></div>
                                <div style={styles.compRow}><span>سرعة المعالجة</span> <b>{statsA.avgHrs} ساعة</b></div>
                            </div>
                        </div>
                        <div onClick={() => onDrillDown('الكل', ctxB.title === defaultCtx.title ? '' : ctxB.title)} style={{...styles.comparePanel, borderTop: `4px solid #d97706`, cursor: 'pointer'}}>
                            <DonutChart percentage={statsB.completionRate} color="#d97706" label="إغلاق التذاكر" />
                            <div style={styles.compStats}>
                                <div style={styles.compRow}><span>إجمالي البلاغات</span> <b>{statsB.total}</b></div>
                                <div style={styles.compRow}><span>سرعة المعالجة</span> <b>{statsB.avgHrs} ساعة</b></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'advanced_leaderboard' && (
                <div style={styles.leaderboard}>
                    {leaderboardData.map((eng, idx) => (
                        <div key={eng.uid} onClick={() => onDrillDown('الكل', eng.displayName || eng.email)} style={{...styles.ldRow, background: idx === 0 ? '#f0fdf4' : '#fff', cursor: 'pointer'}}>
                            <div style={styles.ldRank}>#{idx+1}</div>
                            <div style={styles.ldInfo}>
                                <div style={styles.ldName}>{eng.displayName || eng.email.split('@')[0]}</div>
                                <div style={styles.ldScore}>{eng.score} نقطة تميز</div>
                            </div>
                            <div style={styles.ldMeta}>
                                <div style={{textAlign: 'center'}}><Clock size={12} /> {eng.avgHrs}س</div>
                                <div style={{textAlign: 'center'}}><Medal size={12} /> {eng.resolved} تذكرة</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '10px', direction: 'rtl', fontFamily: "'Cairo', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    printBtn: { padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700' },
    tabsContainer: { display: 'flex', gap: '10px', marginBottom: '30px' },
    tab: { flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '14px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s' },
    tabActive: { background: '#005C84', color: '#fff', borderColor: '#005C84' },
    fLabel: { fontSize: '10px', fontWeight: '700', color: '#94a3b8', display: 'block' },
    fSelect: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #eef2f6', background: '#fff', fontSize: '12px', fontWeight: '700', outline: 'none' },
    aiPanel: { background: '#fff', borderRadius: '20px', padding: '25px', border: '1px solid #f1f5f9' },
    botIcon: { width: '48px', height: '48px', background: '#005C84', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    aiInput: { flex: 1, height: '80px', border: '1px solid #eef2f6', borderRadius: '12px', padding: '15px', fontSize: '14px', outline: 'none', resize: 'none' },
    aiBtn: { marginTop: '15px', background: '#F58220', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    aiResultsBox: { marginTop: '30px', borderTop: '1px solid #f1f5f9', paddingTop: '25px' },
    resTitle: { fontSize: '16px', fontWeight: '800', marginBottom: '20px' },
    resGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' },
    resCard: { padding: '15px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' },
    resName: { fontSize: '14px', fontWeight: '700', marginBottom: '12px' },
    resStats: { display: 'flex', justifyContent: 'space-between' },
    resVal: { fontSize: '16px', fontWeight: '800' },
    resLab: { fontSize: '10px', color: '#94a3b8' },
    comparePanel: { flex: 1, background: '#fff', border: '1px solid #f1f5f9', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
    compStats: { width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' },
    compRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' },
    leaderboard: { display: 'flex', flexDirection: 'column', gap: '12px' },
    ldRow: { padding: '15px 25px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '20px' },
    ldRank: { fontSize: '24px', fontWeight: '800', color: '#cbd5e1' },
    ldInfo: { flex: 1 },
    ldName: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
    ldScore: { fontSize: '12px', color: '#64748b' },
    ldMeta: { display: 'flex', gap: '20px', fontSize: '12px', color: '#94a3b8' }
};

export default ReportsAnalyst;
