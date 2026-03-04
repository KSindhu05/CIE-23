import React, { memo } from 'react';
import { X, CheckCircle, Info } from 'lucide-react';

export const ToastNotification = memo(({ show, msg, type }) => {
    if (!show) return null;
    const color = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
    const bg = type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#dbeafe';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', background: 'white',
            padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${color}`, zIndex: 9999,
            animation: 'slideIn 0.3s ease-out'
        }}>
            <div style={{ padding: '0.25rem', borderRadius: '50%', background: bg, color: color }}>
                {type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
            </div>
            <p style={{ margin: 0, fontWeight: 500, color: '#334155' }}>{msg}</p>
        </div>
    );
});

export const SimpleModal = memo(({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
        }}>
            <div style={{
                background: 'white', borderRadius: '16px', width: '90%', maxWidth: '640px',
                padding: '1.5rem 2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', animation: 'fadeIn 0.2s',
                maxHeight: '85vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
});
