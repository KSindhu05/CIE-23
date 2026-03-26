import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/api';
import authenticatedFetch from '../utils/authFetch';
import { X, User, Lock, Eye, EyeOff, Save, Shield, Mail, Building, Hash, GraduationCap, Layers, Edit3, Check, Info, Calendar, Key } from 'lucide-react';
import styles from './ProfileModal.module.css';

const ProfileModal = ({ onClose, inline = false }) => {
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
            const res = await authenticatedFetch(`${API_BASE_URL}/profile`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setNewUsername(data.username || '');
                setEditForm({
                    fullName: data.fullName || '',
                    fullNameKn: data.fullNameKn || '',
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
            const res = await authenticatedFetch(`${API_BASE_URL}/profile`, {
                method: 'PUT',
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
            fullNameKn: profile?.fullNameKn || '',
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
            const body = { currentPassword };
            if (canChangeUsername && newUsername !== profile?.username) {
                body.newUsername = newUsername;
            }
            if (newPassword) {
                body.newPassword = newPassword;
            }

            const res = await authenticatedFetch(`${API_BASE_URL}/profile/credentials`, {
                method: 'PUT',
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


    const getRoleLabel = (role) => {
        switch (role) {
            case 'PRINCIPAL': return '🎓 Principal';
            case 'HOD': return '🏛️ Head of Department';
            case 'FACULTY': return '👨‍🏫 Faculty Member';
            default: return role;
        }
    };

    const role = profile?.role || user?.role;
    const canEditAll = role === 'PRINCIPAL' || role === 'HOD';
    const canEditAny = role === 'PRINCIPAL' || role === 'HOD' || role === 'FACULTY';
    const roleAsDesignation = role === 'PRINCIPAL' ? 'Principal' : role === 'HOD' ? 'Head of Department' : 'Faculty';

    // Build detail cards
    const personalCards = [
        { key: 'fullName', icon: <User size={24} />, label: 'Full Name', value: profile?.fullName, bg: '#eff6ff', iconColor: '#2563eb', editable: true, accentColor: '#2563eb' },
        { key: 'fullNameKn', icon: <User size={24} />, label: 'Full Name (Kannada)', value: profile?.fullNameKn, bg: '#f0fdf4', iconColor: '#059669', editable: true, accentColor: '#059669' },
        { key: 'email', icon: <Mail size={24} />, label: 'Email Address', value: profile?.email, bg: '#fef3c7', iconColor: '#d97706', editable: true, accentColor: '#d97706' },
    ];

    const accountCards = [
        { key: 'username', icon: <Hash size={24} />, label: 'Username / Login ID', value: profile?.username, bg: '#f0fdf4', iconColor: '#059669', editable: false, accentColor: '#059669' },
        { key: 'designation', icon: <GraduationCap size={24} />, label: 'Designation', value: profile?.designation || roleAsDesignation, bg: '#faf5ff', iconColor: '#7c3aed', editable: canEditAll, accentColor: '#7c3aed' },
    ];

    if (role !== 'PRINCIPAL') {
        accountCards.push(
            { key: 'department', icon: <Building size={24} />, label: 'Department', value: profile?.department, bg: '#fce7f3', iconColor: '#be185d', editable: canEditAll, accentColor: '#be185d' }
        );
    }

    if (role === 'FACULTY') {
        accountCards.push(
            { key: 'semester', icon: <GraduationCap size={24} />, label: 'Semester', value: profile?.semester, bg: '#ecfdf5', iconColor: '#059669', editable: false, accentColor: '#059669' },
            { key: 'section', icon: <Layers size={24} />, label: 'Section', value: profile?.section, bg: '#fff7ed', iconColor: '#ea580c', editable: false, accentColor: '#ea580c' }
        );
    }

    const renderDetailCard = (card, i) => (
        <div key={i} className={styles.detailCard} style={{ '--accent': card.accentColor }}>
            <div className={styles.detailIcon} style={{ background: card.bg, color: card.iconColor }}>
                {card.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <div className={styles.detailLabel}>{card.label}</div>
                {editing && card.editable ? (
                    <input
                        value={editForm[card.key] || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, [card.key]: e.target.value }))}
                        style={{
                            fontSize: '1.05rem', fontWeight: 600, color: '#1e293b',
                            border: '1.5px solid #c7d2eb', borderRadius: '10px',
                            padding: '10px 14px', width: '100%', boxSizing: 'border-box',
                            outline: 'none', background: '#f8fafc'
                        }}
                    />
                ) : (
                    <div className={styles.detailValue}>{card.value || '—'}</div>
                )}
            </div>
        </div>
    );

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const modalContent = (
        <div className={inline ? styles.inlineContainer : styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        <User size={20} /> My Details
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'credentials' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('credentials')}
                    >
                        <Lock size={20} /> Change Credentials
                    </button>

                    {canEditAny && activeTab === 'details' && (
                        <div className={styles.tabActions}>
                            {editing ? (
                                <>
                                    <button
                                        onClick={handleCancelEdit}
                                        className={styles.cancelEditBtn}
                                    >
                                        <X size={18} /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        className={styles.saveChangesBtn}
                                    >
                                        <Check size={18} /> {savingProfile ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    className={styles.editProfileBtn}
                                >
                                    <Edit3 size={18} /> Edit Profile
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
                                    style={{ marginBottom: '1.25rem' }}
                                >
                                    {saveMsg.text}
                                </div>
                            )}

                            {/* Personal Information Section */}
                            <div className={styles.sectionHeader}>
                                <User size={18} /> Personal Information
                                <div className={styles.sectionLine} />
                            </div>
                            <div className={styles.detailsGrid}>
                                {personalCards.map(renderDetailCard)}
                            </div>

                            {/* Account Information Section */}
                            <div className={styles.sectionHeader} style={{ marginTop: '0.75rem' }}>
                                <Shield size={18} /> Account & Role Information
                                <div className={styles.sectionLine} />
                            </div>
                            <div className={styles.detailsGrid}>
                                {accountCards.map(renderDetailCard)}
                            </div>

                            {/* Quick Info / Meta Row */}
                            <div className={styles.metaRow}>
                                <div className={styles.metaItem}>
                                    <div className={styles.metaIcon}><Shield size={14} /></div>
                                    <span>Role: <strong>{getRoleLabel(role)}</strong></span>
                                </div>
                                <div className={styles.metaItem}>
                                    <div className={styles.metaIcon}><Calendar size={14} /></div>
                                    <span>Today: <strong>{dateStr}</strong></span>
                                </div>
                                {profile?.username && (
                                    <div className={styles.metaItem}>
                                        <div className={styles.metaIcon}><Hash size={14} /></div>
                                        <span>ID: <strong>{profile.username}</strong></span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.footerInfo}>
                                <Info size={16} />
                                {canEditAny
                                    ? 'Click "Edit Profile" to update your personal details.'
                                    : 'Contact your HOD or administrator to update profile details.'
                                }
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSaveCredentials} className={styles.credForm}>
                            {message.text && (
                                <div className={`${styles.alert} ${message.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
                                    {message.text}
                                </div>
                            )}

                            <div className={styles.credInfo}>
                                <div className={styles.credInfoIcon}><Key size={20} /></div>
                                <span>
                                    Change your login credentials below. You must enter your current password to make any changes.
                                    {canChangeUsername && ' As an HOD, you can also change your username.'}
                                </span>
                            </div>

                            <div className={styles.field}>
                                <label>Current Password <span className={styles.required}>*</span></label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter your current password"
                                        required
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrentPw(!showCurrentPw)}>
                                        {showCurrentPw ? <EyeOff size={20} /> : <Eye size={20} />}
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
                                        placeholder="Enter new username (leave unchanged to keep current)"
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
                                        placeholder="Leave blank to keep current password"
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowNewPw(!showNewPw)}>
                                        {showNewPw ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {newPassword && (
                                <div className={styles.field}>
                                    <label>Confirm New Password <span className={styles.required}>*</span></label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter your new password"
                                    />
                                </div>
                            )}

                            <button type="submit" className={styles.saveBtn} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Credentials'}
                            </button>
                            <div className={styles.footerInfo}>
                                <Info size={16} />
                                If you change your username, you will need to log in again with the new username.
                            </div>
                        </form>
                    )}
                </div>
            </div>
    );

    if (inline) {
        return modalContent;
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            {modalContent}
        </div>
    );
};

export default ProfileModal;
