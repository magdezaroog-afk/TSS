import React from 'react';
import { Printer, Download, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const PerformanceReport = ({ tickets, engineers }) => {
    const stats = {
        total: tickets.length,
        resolved: tickets.filter(t => t.status === 'مكتمل' || t.status === 'Closed').length,
        pending: tickets.filter(t => t.status !== 'مكتمل' && t.status !== 'Closed').length,
        urgent: tickets.filter(t => t.urgency === 'high').length
    };

    const completionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    return (
        <div id="printable-report" style={styles.container}>
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                }
                `}
            </style>
            
            {/* Report Header */}
            <div style={styles.header}>
                <div style={styles.brand}>
                    <div style={styles.logo}>TT</div>
                    <div>
                        <h1 style={styles.brandName}>TechTrack Performance System</h1>
                        <p style={styles.brandSub}>تقرير الأداء الدوري المعتمد</p>
                    </div>
                </div>
                <div style={styles.dateInfo}>
                    <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-LY')}</div>
                    <div>مرجع التقرير: #LITC-RP-{new Date().getFullYear()}</div>
                </div>
            </div>

            {/* Executive Summary */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FileText size={18} /> ملخص الإنجاز التنفيذي</h2>
                <div style={styles.grid}>
                    <div style={{...styles.statBox, borderColor: '#10b981'}}>
                        <div style={styles.statVal}>{stats.resolved}</div>
                        <div style={styles.statLabel}>بلاغات منجزة</div>
                    </div>
                    <div style={{...styles.statBox, borderColor: '#005C84'}}>
                        <div style={styles.statVal}>{completionRate}%</div>
                        <div style={styles.statLabel}>نسبة الإغلاق</div>
                    </div>
                    <div style={{...styles.statBox, borderColor: '#f59e0b'}}>
                        <div style={styles.statVal}>{stats.pending}</div>
                        <div style={styles.statLabel}>تحت المعالجة</div>
                    </div>
                    <div style={{...styles.statBox, borderColor: '#ef4444'}}>
                        <div style={styles.statVal}>{stats.urgent}</div>
                        <div style={styles.statLabel}>حالات حرجة</div>
                    </div>
                </div>
            </div>

            {/* Engineer Performance Table */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><Clock size={18} /> تحليل كفاءة المهندسين</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>المهندس</th>
                            <th style={styles.th}>المستوى</th>
                            <th style={styles.th}>المنجزة</th>
                            <th style={styles.th}>النشطة</th>
                            <th style={styles.th}>التقييم</th>
                        </tr>
                    </thead>
                    <tbody>
                        {engineers.map((eng, idx) => (
                            <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>{eng.displayName || eng.email}</td>
                                <td style={styles.td}>{eng.techLevel || 'ميداني'}</td>
                                <td style={styles.td}>{tickets.filter(t => t.assignedTo === eng.email && (t.status === 'مكتمل' || t.status === 'Closed')).length}</td>
                                <td style={styles.td}>{tickets.filter(t => t.assignedTo === eng.email && t.status !== 'مكتمل').length}</td>
                                <td style={styles.td}>⭐⭐⭐⭐</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer with Signatures */}
            <div style={styles.footer}>
                <div style={styles.signBox}>
                    <div style={styles.signLine}>توقيع رئيس القسم</div>
                    <div style={styles.signName}>أ. مجدي المبروك</div>
                </div>
                <div style={styles.signBox}>
                    <div style={styles.signLine}>ختم الإدارة المعتمد</div>
                </div>
            </div>

            <div className="no-print" style={styles.printAction}>
                <button onClick={() => window.print()} style={styles.printBtn}>
                    <Printer size={16} /> استخراج التقرير للطباعة
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { background: '#fff', padding: '40px', direction: 'rtl', fontFamily: "'Cairo', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #005C84', paddingBottom: '20px', marginBottom: '30px' },
    brand: { display: 'flex', gap: '15px', alignItems: 'center' },
    logo: { width: '50px', height: '50px', background: '#005C84', borderRadius: '12px', color: '#fff', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    brandName: { fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0 },
    brandSub: { fontSize: '12px', color: '#64748b', margin: 0 },
    dateInfo: { textAlign: 'left', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '5px' },
    section: { marginBottom: '40px' },
    sectionTitle: { fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
    statBox: { padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', borderTopWidth: '4px', textAlign: 'center', background: '#f8fafc' },
    statVal: { fontSize: '24px', fontWeight: '800', color: '#1e293b' },
    statLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', marginTop: '5px' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { textAlign: 'right', padding: '12px', background: '#f8fafc', borderBottom: '2px solid #eef2f6', fontSize: '13px', fontWeight: '800' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '12px', fontSize: '13px', color: '#475569' },
    footer: { marginTop: '100px', display: 'flex', justifyContent: 'space-between', padding: '0 50px' },
    signBox: { textAlign: 'center' },
    signLine: { borderTop: '1px solid #cbd5e1', paddingTop: '10px', width: '200px', fontSize: '12px', fontWeight: '700' },
    signName: { fontSize: '11px', color: '#64748b', marginTop: '5px' },
    printAction: { marginTop: '50px', display: 'flex', justifyContent: 'center' },
    printBtn: { padding: '12px 30px', background: '#005C84', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,92,132,0.2)' }
};

export default PerformanceReport;
