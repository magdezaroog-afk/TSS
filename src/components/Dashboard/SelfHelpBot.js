import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaUser, FaSatellite, FaBolt, FaTerminal, FaShieldAlt, FaMicrochip, FaCamera, FaPlus } from 'react-icons/fa';
import { theme } from '../../styles/theme';
import { useNavigate } from 'react-router-dom';

const SelfHelpBot = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { id: 1, text: "أهلاً بك في فضاء الدعم اللوجستي. أنا مساعدك الذكي.. كيف تصف لي المهمة التي تواجهك اليوم؟", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!isOpen) return null;

    // --- Knowledge Base ---
    const getExpertResponse = (input) => {
        const lowerText = input.toLowerCase();

        if (lowerText.includes("طابعة")) {
            return {
                text: "بروتوكول الطابعات: جرب التأكد من كابل البيانات، وإعادة تشغيلها. هل تود أن نفتح لك تذكرة صيانة للقسم الفني؟",
                options: ["فتح تذكرة صيانة", "سأجرب الحل أولاً"]
            };
        }

        if (lowerText.includes("نت") || lowerText.includes("انترنت") || lowerText.includes("شبكة")) {
            return {
                text: "جاري فحص إشارة الشبكة... يبدو أن هناك تذبذب في منطقة (كم4). هل تود إبلاغ مكتب الشبكات؟",
                options: ["نعم، افتح بلاغ", "جاري المحاولة مجدداً"]
            };
        }

        return {
            text: "استلمت الإشارة. هل يمكنني محاولة حلها أم ترغب في تحويلي مباشرة لقسم الصيانة؟",
            options: ["فتح تذكرة صيانة", "جاري الشرح..."]
        };
    };

    const handleSend = async (text, image = null) => {
        if (!text.trim() && !image) return;
        
        const userMsg = { 
            id: Date.now(), 
            text: text || "إرسال صورة...", 
            sender: 'user',
            image: image ? URL.createObjectURL(image) : null
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setTempImage(null);
        setIsTyping(true);

        setTimeout(() => {
            if (text === "فتح تذكرة صيانة" || text === "نعم، افتح بلاغ") {
                navigate('/employee/create');
                onClose();
                return;
            }

            const response = getExpertResponse(text);
            const botMsg = { id: Date.now() + 1, text: response.text, sender: 'bot', options: response.options };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1200);
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setTempImage(e.target.files[0]);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.container}>
                <div style={styles.hudBracketTop}></div>
                <div style={styles.hudBracketBottom}></div>

                {/* Header */}
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={styles.botIconWrapper}>
                            <FaRobot style={styles.botIcon} />
                            <div style={styles.scanLine}></div>
                        </div>
                        <div>
                            <h3 style={styles.title}>COG-BOT <span style={styles.badge}>SUPPORT AI</span></h3>
                            <div style={styles.status}><div style={styles.statusDot}></div> ORBITAL CONNECTION: SECURE</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><FaTimes /></button>
                </div>

                {/* Chat Flow */}
                <div style={styles.messagesArea}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                            gap: '12px'
                        }}>
                            <div style={{
                                ...styles.messageWrapper,
                                flexDirection: msg.sender === 'bot' ? 'row' : 'row-reverse'
                            }}>
                                <div style={{
                                    ...styles.avatar,
                                    background: msg.sender === 'bot' ? 'rgba(243, 112, 33, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                                    border: msg.sender === 'bot' ? `1px solid ${theme.colors.primary}44` : '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {msg.sender === 'bot' ? <FaMicrochip style={{ color: theme.colors.primary }} /> : <FaUser style={{ color: '#94a3b8' }} />}
                                </div>
                                <div style={{
                                    ...styles.messageBubble,
                                    background: msg.sender === 'bot' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(243, 112, 33, 0.1)',
                                    border: msg.sender === 'bot' ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${theme.colors.primary}33`,
                                    borderRadius: msg.sender === 'bot' ? '0 20px 20px 20px' : '20px 0 20px 20px',
                                    color: msg.sender === 'bot' ? '#cbd5e1' : '#fff'
                                }}>
                                    <div style={styles.msgRef}>{msg.sender === 'bot' ? 'TRANSMISSION_BOT' : 'TRANSMISSION_USER'}</div>
                                    {msg.image && (
                                        <img src={msg.image} alt="User Upload" style={styles.msgImage} />
                                    )}
                                    {msg.text}
                                </div>
                            </div>

                            {msg.sender === 'bot' && msg.options && (
                                <div style={styles.nestedOptions}>
                                    {msg.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleSend(opt)}
                                            style={{
                                                ...styles.nestedOptionBtn,
                                                background: opt === 'فتح تذكرة صيانة' ? `${theme.colors.primary}22` : 'rgba(255,255,255,0.02)',
                                                borderColor: opt === 'فتح تذكرة صيانة' ? theme.colors.primary : 'rgba(255,255,255,0.05)',
                                                color: opt === 'فتح تذكرة صيانة' ? theme.colors.primary : '#94a3b8'
                                            }}
                                        >
                                            {opt === 'فتح تذكرة صيانة' ? <FaPlus style={{ marginLeft: '8px' }} /> : null}
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div style={styles.typing}>
                            <div style={styles.loadingDots}><span></span><span></span><span></span></div>
                            جاري تحليل الإشارة...
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {tempImage && (
                    <div style={styles.tempImagePreview}>
                        <img src={URL.createObjectURL(tempImage)} alt="Temp" />
                        <button onClick={() => setTempImage(null)}><FaTimes /></button>
                    </div>
                )}

                <div style={styles.inputArea}>
                    <label style={styles.cameraLabel}>
                        <input type="file" onChange={handleImageChange} style={{ display: 'none' }} />
                        <FaCamera />
                    </label>
                    <input
                        style={styles.input}
                        placeholder="أدخل رسالتك للنظام... (مثال: عطل طابعة)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend(inputText, tempImage)}
                    />
                    <button style={styles.sendBtn} onClick={() => handleSend(inputText, tempImage)}>
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(5, 11, 20, 0.9)',
        backdropFilter: 'blur(30px)',
        zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
    },
    container: {
        width: '100%', maxWidth: '650px', height: '85vh',
        background: 'rgba(5, 11, 20, 0.8)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '32px',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        overflow: 'hidden'
    },
    hudBracketTop: {
        position: 'absolute', top: '15px', left: '15px', right: '15px', height: '20px',
        borderTop: '1px solid rgba(243, 112, 33, 0.2)', borderLeft: '1px solid rgba(243, 112, 33, 0.2)', borderRight: '1px solid rgba(243, 112, 33, 0.2)',
        pointerEvents: 'none'
    },
    hudBracketBottom: {
        position: 'absolute', bottom: '15px', left: '15px', right: '15px', height: '20px',
        borderBottom: '1px solid rgba(243, 112, 33, 0.2)', borderLeft: '1px solid rgba(243, 112, 33, 0.2)', borderRight: '1px solid rgba(243, 112, 33, 0.2)',
        pointerEvents: 'none'
    },
    header: {
        padding: '40px 40px 25px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 1
    },
    botIconWrapper: {
        width: '56px', height: '56px', borderRadius: '18px',
        background: 'rgba(243, 112, 33, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(243, 112, 33, 0.3)'
    },
    botIcon: { fontSize: '26px', color: theme.colors.primary },
    scanLine: {
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: theme.colors.primary, boxShadow: `0 0 10px ${theme.colors.primary}`,
        animation: 'scanning 2s linear infinite', opacity: 0.5
    },
    title: { margin: 0, fontSize: '22px', color: '#fff', fontWeight: '900', letterSpacing: '1px' },
    badge: { background: 'rgba(243, 112, 33, 0.1)', color: theme.colors.primary, padding: '4px 12px', borderRadius: '8px', fontSize: '9px', fontWeight: '900', letterSpacing: '1px' },
    status: { fontSize: '10px', color: '#64748b', marginTop: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' },
    closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer' },

    messagesArea: {
        flex: 1, padding: '30px 40px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '30px',
    },
    messageWrapper: { display: 'flex', gap: '18px', alignItems: 'flex-end', maxWidth: '85%' },
    avatar: { width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    messageBubble: { padding: '18px 24px', fontSize: '15px', lineHeight: '1.7', backdropFilter: 'blur(10px)' },
    msgRef: { fontSize: '9px', fontWeight: '900', color: theme.colors.primary, marginBottom: '8px', letterSpacing: '2px', opacity: 0.6 },
    msgImage: { maxWidth: '100%', borderRadius: '15px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.1)' },

    nestedOptions: { display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: '60px', marginTop: '5px' },
    nestedOptionBtn: {
        border: '1px solid rgba(255,255,255,0.05)',
        padding: '12px 24px', borderRadius: '14px', fontSize: '14px',
        cursor: 'pointer', textAlign: 'right', transition: '0.3s', width: 'fit-content', fontWeight: 'bold',
        display: 'flex', alignItems: 'center'
    },

    typing: { fontSize: '11px', color: theme.colors.primary, marginLeft: '60px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '900', letterSpacing: '2px' },

    tempImagePreview: {
        padding: '0 40px', position: 'relative', display: 'flex', alignItems: 'center', gap: '15px'
    },
    tempImagePreviewImg: {
        width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid' + theme.colors.primary
    },

    inputArea: { padding: '40px', display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 1 },
    cameraLabel: { fontSize: '24px', color: '#94a3b8', cursor: 'pointer' },
    input: {
        flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '20px', padding: '20px 28px', color: '#fff', fontSize: '15px', outline: 'none'
    },
    sendBtn: {
        width: '60px', height: '60px', borderRadius: '20px',
        background: theme.colors.primary, border: 'none', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px',
        boxShadow: `0 10px 30px ${theme.colors.primary}44`
    }
};


export default SelfHelpBot;
