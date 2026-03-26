import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../components/GlobalDialogProvider';
import API_BASE_URL from '../config/api';
import authenticatedFetch from '../utils/authFetch';
import ProfileModal from '../components/ProfileModal';
import styles from './PrincipalDashboard.module.css';
import {
    LayoutDashboard, Users, ShieldCheck, Calendar, BarChart2,
    Briefcase, Bell, AlertTriangle, FileText, Building, LogOut,
    RotateCw, Settings, Trash2, GraduationCap, User
} from 'lucide-react';
import headerLogo from '../assets/header_logo.png';

// Import Extracted Components
import { ToastNotification, SimpleModal } from '../components/dashboard/principal/Shared';
import { StudentSentinel } from '../components/dashboard/principal/Widgets';
import OverviewSection from '../components/dashboard/principal/OverviewSection';
import ComplianceSection from '../components/dashboard/principal/ComplianceSection';
import DepartmentSection from '../components/dashboard/principal/DepartmentSection';
// import FacultySection from '../components/dashboard/principal/FacultySection'; // Replaced by FacultyDirectorySection
import { DirectorySection } from '../components/dashboard/principal/DirectorySection';

import {
    FacultyDirectorySection, CIEScheduleSection,
    ReportsSection, NotificationsSection, ManageHODsSection
} from '../components/dashboard/principal/SectionComponents';

import {
    fetchPrincipalDashboard, fetchAllFaculty, fetchTimetables,
    fetchNotifications, fetchReports, fetchHods, createHod, updateHod, deleteHod,
    fetchSemesterStatus, updateSemesterStatus, resetMarks, resetFaculty, cleanupData, shiftSemesters
} from '../services/api';


const PrincipalDashboard = () => {
    const { user, logout } = useAuth();
    const { showConfirm } = useDialog();
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('principalActiveTab') || 'overview';
    });

    useEffect(() => {
        sessionStorage.setItem('principalActiveTab', activeTab);
    }, [activeTab]);

    // Data States
    const [dashboardData, setDashboardData] = useState(null);
    const [facultyList, setFacultyList] = useState([]);
    const [hodList, setHodList] = useState([]);
    const [timetables, setTimetables] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);
    const [semesterStatus, setSemesterStatus] = useState('ACTIVE');
    const [targetSemester, setTargetSemester] = useState('');
    const [shiftFrom, setShiftFrom] = useState('');
    const [shiftTo, setShiftTo] = useState('');
    const [resetLoading, setResetLoading] = useState(false);

    // Directory State
    const [selectedDept, setSelectedDept] = useState(null);
    const [deptStudents, setDeptStudents] = useState([]);

    // Interaction State
    const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Notification Sending State
    const [msgRecipientType, setMsgRecipientType] = useState('HOD');
    const [msgTargetDept, setMsgTargetDept] = useState('ALL');
    const [msgText, setMsgText] = useState('');

    // Fetch All Data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const token = user?.token;
                console.log("DEBUG: Fetching Principal Dashboard with token:", token ? "Present" : "Missing");
                setLoading(true);

                // Parallel fetching of all required data
                const [
                    dashData,
                    faculty,
                    hods,
                    times,
                    notifs,
                    reps,
                    semStatus
                ] = await Promise.all([
                    fetchPrincipalDashboard(),
                    fetchAllFaculty(),
                    fetchHods(),
                    fetchTimetables(),
                    fetchNotifications(),
                    fetchReports(),
                    fetchSemesterStatus()
                ]);

                if (dashData) setDashboardData(dashData);
                if (faculty) setFacultyList(faculty);
                if (hods) {
                    console.log("DEBUG: HODs fetched:", hods);
                    setHodList(hods);
                } else {
                    console.warn("DEBUG: HODs fetch returned null/undefined");
                }
                if (times) setTimetables(times);
                if (notifs) setNotifications(notifs);
                if (reps) setReports(reps);
                if (semStatus) setSemesterStatus(semStatus.status);

            } catch (error) {
                console.error("Failed to load dashboard data details:", error);
                if (error.response) {
                    console.error("Response status:", error.response.status);
                    console.error("Response data:", await error.response.json());
                }
                showToast("Failed to load live data: " + error.message, "error");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadDashboardData();
        }
    }, [user]);

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 3000);
    }, []);

    const handleDownload = useCallback(async (item) => {
        showToast(`Generating ${item.name || 'report'}...`, 'info');
        try {
            const token = user?.token;
            const apiType = item.apiType || item.name.toLowerCase().replace(/ /g, '_');
            const response = await authenticatedFetch(`${API_BASE_URL}/principal/reports/download/${apiType}`);

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${apiType}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Report downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Failed to download report', 'error');
        }
    }, [user, showToast, API_BASE_URL]);
    const handleNewBroadcast = useCallback(() => setActiveModal('broadcast'), []);
    const handleSaveFaculty = useCallback((e) => { e.preventDefault(); setActiveModal(null); showToast('Faculty Saved', 'success'); }, [showToast]);

    // MENU ITEMS - format compatible with Sidebar component
    const menuItems = [
        { label: 'Overview', path: '#overview', icon: <LayoutDashboard size={20} />, isActive: activeTab === 'overview', onClick: () => setActiveTab('overview') },
        { label: 'Departments', path: '#departments', icon: <Building size={20} />, isActive: activeTab === 'departments', onClick: () => setActiveTab('departments') },
        { label: 'Manage HODs', path: '#hods', icon: <ShieldCheck size={20} />, isActive: activeTab === 'hod-management', onClick: () => setActiveTab('hod-management') },
        { label: 'Faculty Directory', path: '#faculty', icon: <Briefcase size={20} />, isActive: activeTab === 'faculty', onClick: () => setActiveTab('faculty') },
        { label: 'Student Search', path: '#directory', icon: <Users size={20} />, isActive: activeTab === 'directory', onClick: () => { setActiveTab('directory'); setSelectedDept(null); } },
        { label: 'CIE Schedule', path: '#timetables', icon: <Calendar size={20} />, isActive: activeTab === 'timetables', onClick: () => setActiveTab('timetables') },
        { label: 'CIE Compliance', path: '#compliance', icon: <ShieldCheck size={20} />, isActive: activeTab === 'compliance', onClick: () => setActiveTab('compliance') },
        { label: 'Reports & Analytics', path: '#reports', icon: <FileText size={20} />, isActive: activeTab === 'reports', onClick: () => setActiveTab('reports') },
        { label: 'My Profile', category: 'Account', path: '#profile', icon: <User size={20} />, isActive: activeTab === 'profile', onClick: () => setActiveTab('profile') },
        {
            label: 'Notifications',
            category: 'Account',
            path: '#notifications',
            icon: <Bell size={20} />,
            isActive: activeTab === 'notifications',
            onClick: async () => {
                setActiveTab('notifications');
                // Mark all local notifications as read to clear badge immediately
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                try {
                    await authenticatedFetch(`${API_BASE_URL}/notifications/read-all`, {
                        method: 'POST'
                    });
                } catch (error) {
                    console.error('Failed to mark notifications as read:', error);
                }
            },
            badge: notifications.filter(n => !n.isRead).length || null
        },
        { label: 'Semester Reset', path: '#semester', icon: <Settings size={20} />, isActive: activeTab === 'semester-management', onClick: () => setActiveTab('semester-management') }
    ];

    /* Chart Configs and Helper Logic */
    const barData = useMemo(() => {
        if (!dashboardData) return null;
        return {
            labels: dashboardData.branches || ['CS', 'EC', 'ME', 'CV'],
            datasets: [{
                label: 'Avg CIE Performance (%)',
                data: dashboardData.branchPerformance || [0, 0, 0, 0],
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                borderRadius: 6
            }]
        };
    }, [dashboardData]);

    const departments = useMemo(() => {
        if (!dashboardData?.branches) return [];

        // Color palette for departments
        const colorPalette = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

        // Known department code -> full name mappings
        const deptNames = {
            'CS': 'Computer Science', 'CSE': 'Computer Science',
            'EC': 'Electronics', 'ECE': 'Electronics & Communication',
            'ME': 'Mechanical', 'MECH': 'Mechanical',
            'CV': 'Civil', 'CIVIL': 'Civil',
            'EE': 'Electrical', 'EEE': 'Electrical & Electronics',
            'IS': 'Information Science', 'ISE': 'Information Science',
            'AI': 'Artificial Intelligence', 'AIML': 'AI & Machine Learning',
        };

        return dashboardData.branches.map((branch, index) => {
            const hodInfo = dashboardData.hodSubmissionStatus?.find(h => h.dept === branch);
            return {
                id: branch,
                name: deptNames[branch.toUpperCase()] || branch,
                hod: hodInfo ? hodInfo.hod : 'Not Assigned',
                color: colorPalette[index % colorPalette.length],
                studentCount: dashboardData.deptStudentCounts?.[branch] || 0
            };
        });
    }, [dashboardData]);

    const handleDeptClick = useCallback((dept) => {
        setSelectedDept(dept);
        // Students are fetched by DirectorySection internally based on selectedDept
        setDeptStudents([]);
    }, []);

    const handleRemoveFaculty = useCallback(() => setActiveModal('removeFaculty'), []);

    // const handleViewGrievance = useCallback((g) => {
    //     setSelectedItem(g);
    //     setActiveModal('grievance');
    // }, []);

    // --- Notification Handlers ---

    const handleSendNotification = useCallback(async () => {
        if (!msgText.trim()) return;
        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/notifications/broadcast`, {
                method: 'POST',
                body: JSON.stringify({
                    senderId: user?.username || 'principal',
                    message: msgText,
                    targetRole: msgRecipientType,
                    department: msgTargetDept
                })
            });
            const data = await res.json();
            showToast(data.message || 'Message sent!', 'success');

            // Immediately show the sent message in the notifications list
            const scopeLabel = msgTargetDept && msgTargetDept !== 'ALL'
                ? `${msgTargetDept} ${msgRecipientType}s`
                : `All ${msgRecipientType}s`;
            const sentNotif = {
                id: `local-${Date.now()}`,
                message: msgText,
                type: 'SENT',
                category: `📤 Sent to ${scopeLabel}`,
                createdAt: new Date().toISOString(),
                isRead: true
            };
            setNotifications(prev => [sentNotif, ...prev]);
            setMsgText('');
        } catch (err) {
            console.error('Send notification error:', err);
            showToast('Failed to send notification', 'error');
        }
    }, [msgText, msgRecipientType, msgTargetDept, user, showToast]);


    const handleClearNotifications = useCallback(async () => {
        try {
            const token = user?.token;
            await authenticatedFetch(`${API_BASE_URL}/notifications/clear`, {
                method: 'DELETE'
            });
            setNotifications([]);
            showToast('Notifications cleared', 'info');
        } catch (err) {
            console.error('Clear notifications error:', err);
            showToast('Failed to clear notifications', 'error');
        }
    }, [user, showToast]);

    const handleDeleteNotification = useCallback(async (id) => {
        try {
            const token = user?.token;
            await authenticatedFetch(`${API_BASE_URL}/notifications/${id}`, {
                method: 'DELETE'
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Delete notification error:', err);
            showToast('Failed to delete notification', 'error');
        }
    }, [user, showToast]);

    const handleCreateHod = useCallback(async (hodData) => {
        try {
            const token = user?.token;
            const newHod = await createHod(hodData);
            setHodList(prev => [...prev, newHod]);
            showToast('HOD Registered Successfully', 'success');
            // Re-fetch dashboard data so the new department appears immediately
            try {
                const dashData = await fetchPrincipalDashboard();
                if (dashData) setDashboardData(dashData);
            } catch (e) { /* silent — department will appear on next reload */ }
        } catch (error) {
            showToast('Failed to register HOD: ' + error.message, 'error');
        }
    }, [user, showToast]);

    const handleRefreshHods = useCallback(async () => {
        try {
            const token = user?.token;
            const hods = await fetchHods();
            if (hods) {
                setHodList(hods);
                showToast('HOD List Updated', 'success');
            }
        } catch (error) {
            showToast('Failed to refresh HODs', 'error');
        }
    }, [user, showToast]);

    const handleUpdateHod = useCallback(async (id, hodData) => {
        try {
            const token = user?.token;
            const updated = await updateHod(id, hodData);
            setHodList(prev => prev.map(h => h.id === id ? updated : h));
            showToast('HOD Updated Successfully', 'success');
        } catch (error) {
            showToast('Failed to update HOD: ' + error.message, 'error');
        }
    }, [user, showToast]);

    const handleDeleteHod = useCallback(async (id) => {
        try {
            const token = user?.token;
            await deleteHod(id);
            setHodList(prev => prev.filter(h => h.id !== id));
            showToast('HOD Removed Successfully', 'success');
        } catch (error) {
            showToast('Failed to remove HOD: ' + error.message, 'error');
        }
    }, [user, showToast]);

    const handleLogout = () => {
        logout();
    };

    return (
        <DashboardLayout menuItems={menuItems}>
            {/* --- HEADER (Faculty-style) --- */}
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 className={styles.welcomeText}>Hello, Dr. Gowri Shankar</h1>
                        <p className={styles.subtitle}>Principal | Sanjay Gandhi Polytechnic</p>
                    </div>
                    <div className={styles.headerActions}>
                        <StudentSentinel students={deptStudents} />
                    </div>
                </div>
            </header>

            {/* Dynamic Content */}
            <div className={styles.sectionVisible}>
                {activeTab === 'overview' && (
                    <OverviewSection
                        stats={dashboardData?.stats}
                        chartData={barData}
                        branches={dashboardData?.branches}
                        branchPerformance={dashboardData?.branchPerformance}
                        deptStudentCounts={dashboardData?.deptStudentCounts}
                        deptCompletedCounts={dashboardData?.deptCompletedCounts}
                        lowPerformers={dashboardData?.lowPerformers}
                        facultyAnalytics={dashboardData?.facultyAnalytics}
                        schedule={dashboardData?.dates}
                        approvals={dashboardData?.approvals}
                        cieStats={dashboardData?.cieStats}
                        trends={dashboardData?.trends}
                        hodSubmissionStatus={dashboardData?.hodSubmissionStatus}
                        onNavigate={setActiveTab}
                        loading={loading}
                    />
                )}

                {activeTab === 'compliance' && <ComplianceSection hodSubmissionStatus={dashboardData?.hodSubmissionStatus} loading={loading} />}

                {activeTab === 'departments' && (
                    <DepartmentSection
                        departments={departments}
                        facultyList={facultyList}
                        loading={loading}
                    />
                )}

                {activeTab === 'directory' && <DirectorySection
                    departments={departments}
                    selectedDept={selectedDept}
                    deptStudents={deptStudents}
                    handleDeptClick={handleDeptClick}
                    setSelectedDept={setSelectedDept}
                    loading={loading}
                />}

                {activeTab === 'hod-management' && (
                    <ManageHODsSection
                        hods={hodList}
                        onCreate={handleCreateHod}
                        onUpdate={handleUpdateHod}
                        onDelete={handleDeleteHod}
                        user={user}
                        departments={departments}
                        onRefresh={handleRefreshHods}
                        loading={loading}
                    />
                )}

                {activeTab === 'faculty' && <FacultyDirectorySection facultyMembers={facultyList} onRemove={handleRemoveFaculty} loading={loading} />}

                {activeTab === 'timetables' && <CIEScheduleSection schedules={timetables} onDownload={handleDownload} loading={loading} />}
                {activeTab === 'notifications' && <NotificationsSection
                    notifications={notifications}
                    recipientType={msgRecipientType}
                    setRecipientType={setMsgRecipientType}
                    targetDept={msgTargetDept}
                    setTargetDept={setMsgTargetDept}
                    messageText={msgText}
                    setMessageText={setMsgText}
                    onSend={handleSendNotification}
                    onClear={handleClearNotifications}
                    onDelete={handleDeleteNotification}
                    loading={loading}
                    departments={departments}
                />}
                {activeTab === 'reports' && <ReportsSection reports={reports} onDownload={handleDownload} departments={departments} loading={loading} />}

                {activeTab === 'semester-management' && (
                    <div style={{ animation: 'fadeIn 0.6s ease' }}>
                        {/* 🔥 Danger Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%)',
                            borderRadius: '16px', padding: '2rem 2.5rem', marginBottom: '2rem',
                            border: '1px solid #fca5a5',
                            boxShadow: '0 4px 24px rgba(239,68,68,0.08)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: '-50%', right: '-10%',
                                width: '300px', height: '300px', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                                <div style={{
                                    background: '#fee2e2', border: '1px solid #fca5a5',
                                    borderRadius: '12px', padding: '0.75rem',
                                    boxShadow: '0 2px 8px rgba(239,68,68,0.15)'
                                }}>
                                    <AlertTriangle size={28} color="#dc2626" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
                                        Semester-End Management
                                    </h2>
                                    <p style={{ margin: '0.25rem 0 0', color: '#dc2626', fontSize: '0.85rem', fontWeight: 500 }}>
                                        ⚠️ All actions below are permanent and institution-wide. Proceed with caution.
                                    </p>
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <select
                                        value={targetSemester}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setTargetSemester(val);
                                            // Auto-populate shift From/To if numeric semester is picked
                                            if (val && val !== 'All') {
                                                const currentSem = parseInt(val);
                                                setShiftFrom(currentSem.toString());
                                                if (currentSem < 6) {
                                                    setShiftTo((currentSem + 1).toString());
                                                } else {
                                                    setShiftTo('');
                                                }
                                            } else {
                                                setShiftFrom('');
                                                setShiftTo('');
                                            }
                                        }}
                                        className={styles.semesterDropdown}
                                    >
                                        <option value="" disabled>Select Target Semester</option>
                                        <option value="All">Institution Wide (All Semesters)</option>
                                        {[1, 2, 3, 4, 5, 6].map(sem => (
                                            <option key={sem} value={sem}>Semester {sem} Only</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>


                            {/* Card 2: Clear Marks */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '16px', padding: '1.75rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                animation: 'fadeIn 0.5s ease 0.2s both'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <div style={{
                                        background: '#fef2f2',
                                        borderRadius: '12px', padding: '0.75rem',
                                        boxShadow: '0 2px 8px rgba(239,68,68,0.1)'
                                    }}>
                                        <Trash2 size={22} color="#dc2626" />
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px',
                                        color: '#dc2626', padding: '0.25rem 0.6rem',
                                        border: '1px solid #fca5a5', borderRadius: '6px'
                                    }}>DANGER</div>
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Clear Academic Marks</h3>
                                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                    Permanently wipe CIE marks for {targetSemester === 'All' ? 'every student across all departments' : `students in Semester ${targetSemester}`}. <strong style={{ color: '#dc2626' }}>Irreversible.</strong>
                                </p>
                                <button
                                    onClick={async () => {
                                        const confirmed = await showConfirm({
                                            title: 'Wipe Marks',
                                            message: targetSemester === 'All' ? 'CRITICAL: Are you sure you want to WIPE ALL MARKS? This cannot be undone.' : `CRITICAL: Are you sure you want to WIPE MARKS FOR SEMESTER ${targetSemester}? This cannot be undone.`,
                                            variant: 'danger',
                                            confirmText: 'Wipe Marks'
                                        });
                                        if (confirmed) {
                                            setResetLoading(true);
                                            resetMarks(targetSemester)
                                                .then(() => showToast(`Marks Cleared (${targetSemester === 'All' ? 'All' : 'Sem ' + targetSemester})`, 'success'))
                                                .catch(() => showToast('Failed to clear marks', 'error'))
                                                .finally(() => setResetLoading(false));
                                        }
                                    }}
                                    disabled={resetLoading || !targetSemester}
                                    style={{
                                        width: '100%', padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '10px',
                                        background: '#ffffff',
                                        color: '#1e293b', fontWeight: 600, fontSize: '0.9rem', cursor: resetLoading || !targetSemester ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: resetLoading || !targetSemester ? 0.5 : 1
                                    }}
                                    onMouseEnter={e => {
                                        if (!resetLoading && targetSemester) {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    {resetLoading ? '⏳ Clearing...' : '🗑️ Clear All Marks'}
                                </button>
                            </div>

                            {/* Card 3: Shift Semester */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '16px', padding: '1.75rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                animation: 'fadeIn 0.5s ease 0.3s both'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <div style={{
                                        background: '#f0fdf4',
                                        borderRadius: '12px', padding: '0.75rem',
                                        boxShadow: '0 2px 8px rgba(34,197,94,0.1)'
                                    }}>
                                        <RotateCw size={22} color="#16a34a" />
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px',
                                        color: '#16a34a', padding: '0.25rem 0.6rem',
                                        border: '1px solid #bbf7d0', borderRadius: '6px'
                                    }}>PROGRESSION</div>
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Shift to Next Semester</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', opacity: !targetSemester ? 0.5 : 1 }}>
                                    <select
                                        value={shiftFrom}
                                        onChange={(e) => setShiftFrom(e.target.value)}
                                        disabled={!targetSemester}
                                        style={{
                                            flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #bbf7d0',
                                            background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', outline: 'none',
                                            cursor: !targetSemester ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <option value="" disabled>From</option>
                                        {[1, 2, 3, 4, 5, 6].map(sem => (
                                            <option key={sem} value={sem}>Sem {sem}</option>
                                        ))}
                                    </select>
                                    <span style={{ color: '#16a34a', fontWeight: 900 }}>→</span>
                                    <select
                                        value={shiftTo}
                                        onChange={(e) => setShiftTo(e.target.value)}
                                        disabled={!targetSemester}
                                        style={{
                                            flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #bbf7d0',
                                            background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', outline: 'none',
                                            cursor: !targetSemester ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <option value="" disabled>To</option>
                                        {[1, 2, 3, 4, 5, 6].map(sem => (
                                            <option key={sem} value={sem}>Sem {sem}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={async () => {
                                        const confirmed = await showConfirm({
                                            title: 'Semester Shift',
                                            message: `Move all students from Semester ${shiftFrom} to Semester ${shiftTo}?`,
                                            variant: 'warning',
                                            confirmText: 'Move Students'
                                        });
                                        if (confirmed) {
                                            setResetLoading(true);
                                            shiftSemesters(targetSemester || 'All', shiftFrom, shiftTo)
                                                .then((res) => {
                                                    showToast(res.message || 'Students Shifted Successfully', 'success');
                                                    setShiftFrom('');
                                                    setShiftTo('');
                                                })
                                                .catch(() => showToast('Failed to shift semesters', 'error'))
                                                .finally(() => setResetLoading(false));
                                        }
                                    }}
                                    disabled={resetLoading || !targetSemester || !shiftFrom || !shiftTo}
                                    style={{
                                        width: '100%', padding: '0.75rem', border: '1px solid #bbf7d0', borderRadius: '10px',
                                        background: shiftFrom && shiftTo ? '#f0fdf4' : '#ffffff',
                                        color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', cursor: resetLoading || !targetSemester || !shiftFrom || !shiftTo ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: resetLoading || !targetSemester || !shiftFrom || !shiftTo ? 0.5 : 1
                                    }}
                                    onMouseEnter={e => {
                                        if (!resetLoading && targetSemester && shiftFrom && shiftTo) {
                                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                                            e.currentTarget.style.boxShadow = '0 10px 25px rgba(34,197,94,0.1)';
                                            e.currentTarget.style.borderColor = '#86efac';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                        e.currentTarget.style.borderColor = '#bbf7d0';
                                    }}
                                >
                                    {resetLoading ? '⏳ Shifting...' : '🚀 Move Students'}
                                </button>
                            </div>

                            {/* Card 4: Faculty & Data Cleanup */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: '16px', padding: '1.75rem',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                animation: 'fadeIn 0.5s ease 0.4s both'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <div style={{
                                        background: '#faf5ff',
                                        borderRadius: '12px', padding: '0.75rem',
                                        boxShadow: '0 2px 8px rgba(168,85,247,0.1)'
                                    }}>
                                        <Settings size={22} color="#7c3aed" />
                                    </div>
                                    <div style={{
                                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1px',
                                        color: '#7c3aed', padding: '0.25rem 0.6rem',
                                        border: '1px solid #e9d5ff', borderRadius: '6px'
                                    }}>CLEANUP</div>
                                </div>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Faculty & Data Cleanup</h3>
                                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                    Reset faculty workloads and wipe notifications &amp; CIE schedules for {targetSemester === 'All' ? 'the entire institution' : `Semester ${targetSemester}`}.
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={async () => {
                                            const confirmed = await showConfirm({
                                                title: 'Reset Faculty',
                                                message: targetSemester === 'All' ? 'Reset all faculty assignments?' : `Reset faculty assignments related to Semester ${targetSemester}?`,
                                                variant: 'warning',
                                                confirmText: 'Reset'
                                            });
                                            if (confirmed) {
                                                resetFaculty(targetSemester)
                                                    .then(() => showToast('Faculty Workloads Reset', 'success'))
                                                    .catch(() => showToast('Failed to reset faculty', 'error'));
                                            }
                                        }}
                                        disabled={!targetSemester}
                                        style={{
                                            flex: 1, padding: '0.7rem', border: '1px solid #e2e8f0',
                                            borderRadius: '10px', background: '#ffffff',
                                            color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', cursor: !targetSemester ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: !targetSemester ? 0.5 : 1
                                        }}
                                        onMouseEnter={e => {
                                            if (targetSemester) {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        👤 Reset Faculty
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const confirmed = await showConfirm({
                                                title: 'System Cleanup',
                                                message: targetSemester === 'All' ? 'Cleanup all notifications and schedules?' : `Cleanup schedules and attendance for Semester ${targetSemester}?`,
                                                variant: 'warning',
                                                confirmText: 'Cleanup'
                                            });
                                            if (confirmed) {
                                                cleanupData(targetSemester)
                                                    .then(() => showToast('System Cleanup Done', 'success'))
                                                    .catch(() => showToast('Cleanup failed', 'error'));
                                            }
                                        }}
                                        disabled={!targetSemester}
                                        style={{
                                            flex: 1, padding: '0.7rem', border: '1px solid #e2e8f0',
                                            borderRadius: '10px', background: '#ffffff',
                                            color: '#1e293b', fontWeight: 600, fontSize: '0.85rem', cursor: !targetSemester ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: !targetSemester ? 0.5 : 1
                                        }}
                                        onMouseEnter={e => {
                                            if (targetSemester) {
                                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                                                e.currentTarget.style.borderColor = '#cbd5e1';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                        }}
                                    >
                                        🧹 Wipe Schedules
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'profile' && <ProfileModal inline={true} />}
            </div>


            {/* Interaction Modals */}
            <ToastNotification show={toast.show} msg={toast.msg} type={toast.type} />

            <SimpleModal isOpen={activeModal === 'removeFaculty'} onClose={() => setActiveModal(null)} title="Remove Faculty">
                <form onSubmit={(e) => { e.preventDefault(); setActiveModal(null); showToast('Faculty Removed', 'success'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                        Are you sure you want to remove a faculty member? This action cannot be undone.
                    </p>
                    <input className={styles.searchBarInput} placeholder="Enter Faculty ID to Remove" required style={{ border: '1px solid #e2e8f0' }} />
                    <button type="submit" className={styles.primaryBtn} style={{ marginTop: '0.5rem', justifyContent: 'center', background: '#ef4444' }}>Confirm Removal</button>
                </form>
            </SimpleModal>
        </DashboardLayout>
    );
};

export default PrincipalDashboard;
