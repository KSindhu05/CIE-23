import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import { X, User, Lock, Eye, EyeOff, Save, Shield, Mail, Building, Hash, GraduationCap, Layers, Edit3, Check } from 'lucide-react';
import styles from './ProfileModal.module.css';

const ProfileModal = ({ onClose }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saveMsg, setSaveMsg] = useState({ text: '', type: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    // Credential form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const canChangeUsername = user?.role === 'HOD' || user?.role === 'PRINCIPAL';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = user?.token;
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const res = await fetch(`${API_BASE_URL}/profile`, { headers });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setNewUsername(data.username || '');
                setEditForm({
                    fullName: data.fullName || '',
                    email: data.email || '',
                    department: data.department || '',
                    designation: data.designation || ''
                });
            }
        } catch (e) {
            console.error('Error fetching profile', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setSaveMsg({ text: '', type: '' });
        try {
            const token = user?.token;
            const res = await fetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (res.ok) {
                setSaveMsg({ text: 'Profile updated successfully!', type: 'success' });
                setProfile(prev => ({ ...prev, ...editForm }));
                setEditing(false);
            } else {
                setSaveMsg({ text: data.message || 'Update failed', type: 'error' });
            }
        } catch (e) {
            setSaveMsg({ text: 'Network error', type: 'error' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setEditForm({
            fullName: profile?.fullName || '',
            email: profile?.email || '',
            department: profile?.department || '',
            designation: profile?.designation || ''
        });
        setSaveMsg({ text: '', type: '' });
    };

    const handleSaveCredentials = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!currentPassword) {
            setMessage({ text: 'Current password is required', type: 'error' });
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            return;
        }
        if (newPassword && newPassword.length < 4) {
            setMessage({ text: 'Password must be at least 4 characters', type: 'error' });
            return;
        }
        if (!newPassword && (!canChangeUsername || newUsername === profile?.username)) {
            setMessage({ text: 'No changes to save', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const token = user?.token;
            const body = { currentPassword };
            if (newPassword) body.newPassword = newPassword;
            if (canChangeUsername && newUsername !== profile?.username) body.newUsername = newUsername;

            const res = await fetch(`${API_BASE_URL}/profile/credentials`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (res.ok) {
                setMessage({ text: data.message || 'Credentials updated! Please re-login if you changed your username.', type: 'success' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage({ text: data.message || 'Update failed', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'Network error', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const getHeaderGradient = (role) => {
        switch (role) {
            case 'PRINCIPAL': return 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)';
            case 'HOD': return 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)';
            case 'FACULTY': return 'linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%)';
            default: return 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)';
        }
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'PRINCIPAL': return '🎓 Principal';
            case 'HOD': return '🏛️ Head of Department';
            case 'FACULTY': return '👨‍🏫 Faculty Member';
            default: return role;
        }
    };

    const role = profile?.role || user?.role;
    const canEdit = role === 'PRINCIPAL' || role === 'HOD';

    const roleAsDesignation = role === 'PRINCIPAL' ? 'Principal' : role === 'HOD' ? 'Head of Department' : 'Faculty';

    const detailCards = [
        { key: 'fullName', icon: <User size={16} />, label: 'Full Name', value: profile?.fullName, bg: '#eff6ff', iconColor: '#2563eb', editable: true },
        { key: 'email', icon: <Mail size={16} />, label: 'Email', value: profile?.email, bg: '#fef3c7', iconColor: '#d97706', editable: true },
        { key: 'username', icon: <Hash size={16} />, label: 'Username', value: profile?.username, bg: '#f0fdf4', iconColor: '#059669', editable: true },
        { key: 'designation', icon: <GraduationCap size={16} />, label: 'Designation', value: profile?.designation || roleAsDesignation, bg: '#ecfdf5', iconColor: '#059669', editable: true },
    ];

    // Show Department for non-Principal
    if (role !== 'PRINCIPAL') {
        detailCards.push(
            { key: 'department', icon: <Building size={16} />, label: 'Department', value: profile?.department, bg: '#fce7f3', iconColor: '#be185d', editable: canEdit },
        );
    }

    // Add faculty-specific fields
    if (role === 'FACULTY') {
        detailCards.push(
            { key: 'semester', icon: <GraduationCap size={16} />, label: 'Semester', value: profile?.semester, bg: '#ecfdf5', iconColor: '#059669', editable: false },
            { key: 'section', icon: <Layers size={16} />, label: 'Section', value: profile?.section, bg: '#fff7ed', iconColor: '#ea580c', editable: false }
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header} style={{ background: getHeaderGradient(role) }}>
                    <div className={styles.headerBg} />
                    <div className={styles.headerContent}>
                        <div className={styles.headerInfo}>
                            <div className={styles.avatarLarge}>
                                {(profile?.fullName || user?.fullName || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.headerTextGroup}>
                                <h2 className={styles.headerName}>{profile?.fullName || user?.fullName || 'User'}</h2>
                                {profile?.email && (
                                    <span className={styles.headerSubtext}>{profile.email}</span>
                                )}
                                <span className={styles.roleBadge}>
                                    <Shield size={11} /> {role}
                                </span>
                            </div>
                        </div>
                        <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <User size={15} /> My Details
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'credentials' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('credentials')}
                    >
                        <Lock size={15} /> Change Credentials
                    </button>

                    {/* Edit button for Principal/HOD */}
                    {canEdit && activeTab === 'details' && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        style={{
                                            padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                            background: 'white', color: '#64748b', fontSize: '0.8rem', fontWeight: 600,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        style={{
                                            padding: '6px 14px', borderRadius: '8px', border: 'none',
                                            background: '#2563eb', color: 'white', fontSize: '0.8rem', fontWeight: 600,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                            opacity: savingProfile ? 0.6 : 1
                                        }}
                                    >
                                        <Check size={14} /> {savingProfile ? 'Saving...' : 'Save'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    style={{
                                        padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                        background: 'white', color: '#2563eb', fontSize: '0.8rem', fontWeight: 600,
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                                    }}
                                >
                                    <Edit3 size={14} /> Edit Profile
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Tab Content */}
                <div className={styles.body}>
                    {loading ? (
                        <div className={styles.loading}>Loading profile...</div>
                    ) : activeTab === 'details' ? (
                        <>
                            {saveMsg.text && (
                                <div
                                    className={`${styles.alert} ${saveMsg.type === 'error' ? styles.alertError : styles.alertSuccess}`}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    {saveMsg.text}
                                </div>
                            )}
                            <div className={styles.detailsGrid}>
                                {detailCards.map((card, i) => (
                                    <div key={i} className={styles.detailCard}>
                                        <div className={styles.detailIcon} style={{ background: card.bg, color: card.iconColor }}>
                                            {card.icon}
                                        </div>
                                        <div className={styles.detailLabel}>{card.label}</div>
                                        {editing && card.editable ? (
                                            <input
                                                value={editForm[card.key] || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, [card.key]: e.target.value }))}
                                                style={{
                                                    fontSize: '0.9rem', fontWeight: 600, color: '#1e293b',
                                                    border: '1.5px solid #c7d2eb', borderRadius: '8px',
                                                    padding: '6px 10px', width: '100%', boxSizing: 'border-box',
                                                    outline: 'none', background: '#f8fafc'
                                                }}
                                                onFocus={e => e.target.style.borderColor = '#2563eb'}
                                                onBlur={e => e.target.style.borderColor = '#c7d2eb'}
                                            />
                                        ) : (
                                            <div className={styles.detailValue}>{card.value || '—'}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSaveCredentials} className={styles.credForm}>
                            {message.text && (
                                <div className={`${styles.alert} ${message.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className={styles.field}>
                                <label>Current Password <span className={styles.required}>*</span></label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        required
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrentPw(!showCurrentPw)}>
                                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {canChangeUsername && (
                                <div className={styles.field}>
                                    <label>New Username</label>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="Enter new username"
                                    />
                                </div>
                            )}

                            <div className={styles.field}>
                                <label>New Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Leave blank to keep current"
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowNewPw(!showNewPw)}>
                                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {newPassword && (
                                <div className={styles.field}>
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                    />
                                </div>
                            )}

                            <button type="submit" className={styles.saveBtn} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
