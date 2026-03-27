import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardLayout from '../components/DashboardLayout';
import RightSidebar from '../components/RightSidebar'; // Import RightSidebar
import API_BASE_URL from '../config/api';
import { Search, Bell, User, Book, Calendar, Mail, FileText, ChevronRight, Download, Menu, X, LogOut, Moon, Sun, Clock, AlertCircle, TrendingUp, BookOpen, CheckCircle, Shield, Hash, GraduationCap, Layers, Info, Phone, LayoutDashboard, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchSemesterStatus } from '../services/api';
import styles from './StudentDashboard.module.css';
import AcademicSummary from '../components/dashboard/student/AcademicSummary';
import AcademicInsights from '../components/dashboard/student/AcademicInsights';
import authenticatedFetch from '../utils/authFetch';
import Skeleton from '../components/ui/Skeleton';
import { StudentTranslations } from '../utils/StudentTranslations';

const StudentDashboard = () => {
    const [lang, setLang] = useState(() => localStorage.getItem('studentLang') || 'EN');
    const t = (key) => StudentTranslations[lang][key] || key;
    
    const toggleLang = () => {
        const newLang = lang === 'EN' ? 'KN' : 'EN';
        setLang(newLang);
        localStorage.setItem('studentLang', newLang);
    };
    const [activeSection, setActiveSection] = useState(() => {
        return sessionStorage.getItem('studentActiveSection') || 'Overview';
    });

    React.useEffect(() => {
        sessionStorage.setItem('studentActiveSection', activeSection);
    }, [activeSection]);
    const [toast, setToast] = useState({ show: false, message: '' });

    const { user } = useAuth(); // Get auth context

    // API State
    const [realMarks, setRealMarks] = useState([]);
    const [realSubjects, setRealSubjects] = useState([]);
    const [cieStatus, setCieStatus] = useState("0/3");

    // CIE & Notification State
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
    const [facultyList, setFacultyList] = useState([]); // Added facultyList state
    const [semesterStatus, setSemesterStatus] = useState('ACTIVE');
    const [loading, setLoading] = useState(true);
    const [perfConfig, setPerfConfig] = useState({
        excellent_threshold: '40',
        low_threshold: '20',
        low_attendance_threshold: '75'
    });

    // Student Profile State
    const [studentInfo, setStudentInfo] = useState({
        name: 'Loading...',
        rollNo: user?.username || '...',
        branch: '...',
        semester: '...',
        section: '...',
        cgpa: 0,
        mentor: 'Not Assigned'
    });

    React.useEffect(() => {
        const fetchPerfConfig = async (dept) => {
            if (!dept) return;
            try {
                const res = await authenticatedFetch(`${API_BASE_URL}/hod/config?department=${dept}`);
                if (res.ok) {
                    const data = await res.json();
                    setPerfConfig(data);
                }
            } catch (e) { console.error("Failed to fetch performance config", e); }
        };

        const fetchMarks = async () => {
            try {
                if (!user || !user.token) return;
                const response = await authenticatedFetch(`${API_BASE_URL}/marks/my-marks`);

                if (response.ok) {
                    const data = await response.json();

                    const groupedMarks = {};
                    data.forEach(mark => {
                        if (!mark.subject) return;
                        const baseName = mark.subject.name.replace(/\s*[\(\[]?(Theory|Lab|T|L|Theory\s+Exam|Practical)[\)\]]?\s*$/i, '').trim();
                        if (!groupedMarks[baseName]) {
                            groupedMarks[baseName] = {
                                name: baseName,
                                code: mark.subject.code.replace(/[-(\s]+(T|L|Theory|Lab)$/i, '').trim(),
                                cie1Score: null, cie2Score: null, cie3Score: null, cie4Score: null, cie5Score: null,
                                cie1Att: null, cie2Att: null, cie3Att: null, cie4Att: null, cie5Att: null,
                                cie1Remark: null, cie2Remark: null, cie3Remark: null, cie4Remark: null, cie5Remark: null,
                                totalScore: 0,
                                subjectIds: new Set([mark.subject.id])
                            };
                        }
                        groupedMarks[baseName].subjectIds.add(mark.subject.id);

                        const score = mark.totalScore;
                        const att = mark.attendancePercentage;
                        const rem = mark.remarks;

                        const type = (mark.cieType || '').replace('-', '').toUpperCase();
                        if (type === 'CIE1') { groupedMarks[baseName].cie1Score = score; groupedMarks[baseName].cie1Att = att; groupedMarks[baseName].cie1Remark = rem; }
                        else if (type === 'CIE2') { groupedMarks[baseName].cie2Score = score; groupedMarks[baseName].cie2Att = att; groupedMarks[baseName].cie2Remark = rem; }
                        else if (type === 'CIE3') { groupedMarks[baseName].cie3Score = score; groupedMarks[baseName].cie3Att = att; groupedMarks[baseName].cie3Remark = rem; }
                        else if (type === 'CIE4') { groupedMarks[baseName].cie4Score = score; groupedMarks[baseName].cie4Att = att; groupedMarks[baseName].cie4Remark = rem; }
                        else if (type === 'CIE5') { groupedMarks[baseName].cie5Score = score; groupedMarks[baseName].cie5Att = att; groupedMarks[baseName].cie5Remark = rem; }
                    });

                    Object.values(groupedMarks).forEach(item => {
                        const s1 = item.cie1Score === -2.0 ? 0 : (item.cie1Score || 0);
                        const s2 = item.cie2Score === -2.0 ? 0 : (item.cie2Score || 0);
                        const s3 = item.cie3Score === -2.0 ? 0 : (item.cie3Score || 0);
                        const s4 = item.cie4Score === -2.0 ? 0 : (item.cie4Score || 0);
                        const s5 = item.cie5Score === -2.0 ? 0 : (item.cie5Score || 0);
                        item.totalScore = s1 + s2 + s3 + s4 + s5;
                    });

                    setRealMarks(Object.values(groupedMarks));

                    setRealMarks(Object.values(groupedMarks));
                    if (data.length > 0) {
                        const s = data[0].student;
                        setStudentInfo(prev => ({
                            ...prev,
                            name: s.name,
                            rollNo: s.regNo,
                            branch: s.department,
                            semester: s.semester,
                            section: s.section,
                            parentPhone: s.parentPhone,
                            overallRemarks: s.overallRemarks || prev.overallRemarks,
                            mentor: s.mentor || 'Not Assigned'
                        }));
                        if (s.department) fetchPerfConfig(s.department);
                        setSelectedSemester(s.semester.toString());
                    }
                    
                    // Always refresh detailed profile for Live Mentor Name
                    try {
                        const profileRes = await authenticatedFetch(`${API_BASE_URL}/student/profile`);
                        if (profileRes.ok) {
                            const p = await profileRes.json();
                            setStudentInfo(prev => ({
                                ...prev,
                                name: p.name,
                                rollNo: p.regNo,
                                branch: p.department,
                                semester: p.semester,
                                section: p.section,
                                parentPhone: p.parentPhone,
                                mentor: (p.mentor && p.mentor !== 'Not Assigned') ?
                                    (lang === 'KN' ? (p.mentorKn || transliterateName(p.mentor, lang)) : p.mentor) : null,
                                mentorKn: p.mentorKn
                            }));
                        }
                    } catch (e) {
                        console.error("Failed to fetch student profile", e);
                    }
                    const uniqueCIEs = new Set(data.filter(m => m.totalScore != null && m.totalScore > 0).map(m => m.cieType));
                    setCieStatus(`${uniqueCIEs.size}/5`);
                }
            } catch (error) { console.error("Failed to fetch marks", error); }
        };

        const loadSemesterStatus = async () => {
            const status = await fetchSemesterStatus();
            if (status) setSemesterStatus(status.status);
        };

        const fetchUpdates = async () => {
            if (!user || !user.token) return;
            try {
                const subRes = await authenticatedFetch(`${API_BASE_URL}/student/subjects`);
                if (subRes.ok) {
                    const subData = await subRes.json();
                    const mergedSubjects = {};
                    subData.forEach(s => {
                        const baseName = s.name.replace(/\s*[\(\[]?(Theory|Lab|T|L|Theory\s+Exam|Practical)[\)\]]?\s*$/i, '').trim();
                        if (!mergedSubjects[baseName]) {
                            mergedSubjects[baseName] = { id: s.id, name: baseName, code: s.code.replace(/[-(\s]+(T|L|Theory|Lab)$/i, '').trim(), department: s.department, semester: s.semester };
                        }
                    });
                    setRealSubjects(Object.values(mergedSubjects));
                }
                const annRes = await authenticatedFetch(`${API_BASE_URL}/cie/student/announcements`);
                if (annRes.ok) {
                    const anns = await annRes.json();
                    const labelMap = { 1: 'CIE-1 (Theory)', 2: 'Skill Test 1 (Lab)', 3: 'CIE-2 (Theory)', 4: 'Skill Test 2 (Lab)', 5: 'Activity' };
                    setUpcomingExams(anns.map(a => ({ id: a.id, exam: labelMap[a.cieNumber] || `CIE-${a.cieNumber}`, subject: a.subject?.name || 'Subject', date: a.scheduledDate, time: a.startTime ? a.startTime.substring(0, 5) : 'TBD', duration: a.durationMinutes + ' mins', room: a.examRoom || 'TBD', instructions: a.instructions, syllabus: a.syllabusCoverage })));
                }
                const notifRes = await authenticatedFetch(`${API_BASE_URL}/cie/student/notifications`);
                if (notifRes.ok) {
                    const notifs = await notifRes.json();
                    const filteredNotifs = notifs.filter(n => !n.message.includes("Welcome to the IA Management System") && n.type !== 'EXAM_SCHEDULE');
                    setNotifications(filteredNotifs.map(n => ({ id: n.id, message: n.message, time: new Date(n.createdAt).toLocaleDateString(), type: (n.type === 'CIE_ANNOUNCEMENT' || n.type === 'EXAM_SCHEDULE') ? 'info' : 'alert', isRead: n.isRead })));
                    setUnreadCount(filteredNotifs.filter(n => !n.isRead).length);
                }
            } catch (e) { console.error("Error fetching updates:", e); } finally { setLoadingAnnouncements(false); }
            try {
                const facRes = await authenticatedFetch(`${API_BASE_URL}/student/faculty`);
                if (facRes.ok) { setFacultyList(await facRes.json()); }
            } catch (e) { console.error("Error fetching faculty:", e); }
        };

        fetchMarks();
        loadSemesterStatus();
        fetchUpdates().finally(() => setLoading(false));
    }, [user]);

    // Reactive Analytics: Update CGPA / Avg Score based on total semester subjects
    React.useEffect(() => {
        if (!realMarks || realMarks.length === 0) return;
        
        const totalMarks = realMarks.reduce((sum, m) => sum + (m.totalScore || 0), 0);
        
        // Denominator based on LOADED subjects if realSubjects exists, otherwise fallback to marks count
        const subjectsCount = realSubjects.length > 0 ? realSubjects.length : realMarks.length;
        const totalMaxMarks = subjectsCount * 50;

        const aggregatePercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
        const avgScore50 = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 50) : 0;

        // Calculate Average Attendance (Real)
        const attRecords = realMarks.filter(m => m.cie1Att != null || m.cie2Att != null || m.cie3Att != null);
        const totalAtt = attRecords.reduce((sum, m) => sum + (m.cie1Att || m.cie2Att || m.cie3Att || 0), 0);
        const avgAttendance = attRecords.length > 0 ? totalAtt / attRecords.length : 100;

        setStudentInfo(prev => ({
            ...prev,
            cgpa: aggregatePercentage,
            avgCieScore: `${avgScore50}/50`,
            avgAttendance: avgAttendance
        }));
    }, [realMarks, realSubjects]);

    const [selectedSemester, setSelectedSemester] = useState('5');
    const [selectedCIE, setSelectedCIE] = useState('All');

    const menuItems = [
        { label: t('overview'), path: '/dashboard/student', icon: <LayoutDashboard size={20} />, isActive: activeSection === 'Overview', onClick: () => setActiveSection('Overview') },
        { label: t('cieMarks'), path: '/dashboard/student', icon: <FileText size={20} />, isActive: activeSection === 'CIE Marks', onClick: () => setActiveSection('CIE Marks') },
        { label: t('subjects'), path: '/dashboard/student', icon: <Book size={20} />, isActive: activeSection === 'Subjects', onClick: () => setActiveSection('Subjects') },
        { label: t('faculty'), path: '/dashboard/student', icon: <User size={20} />, isActive: activeSection === 'Faculty', onClick: () => setActiveSection('Faculty') },
        { label: t('syllabusNotif'), path: '/dashboard/student', icon: <BookOpen size={20} />, isActive: activeSection === 'Syllabus Topics', onClick: () => setActiveSection('Syllabus Topics') },
        {
            label: t('notifications'), path: '/dashboard/student', icon: <Bell size={20} />, isActive: activeSection === 'Notifications', onClick: async () => {
                setActiveSection('Notifications');
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                try {
                    await authenticatedFetch(`${API_BASE_URL}/notifications/read-all`, { method: 'POST' });
                } catch (e) {
                    console.error("Failed to mark all as read", e);
                }
            }, badge: unreadCount || null
        },
        { label: t('profile'), path: '/dashboard/student', icon: <User size={20} />, isActive: activeSection === 'Profile', onClick: () => setActiveSection('Profile') },
    ];

    const showToast = (message) => { setToast({ show: true, message }); setTimeout(() => setToast({ show: false, message: '' }), 3000); };
    const handleDownload = () => window.print();
    const getStatus = (marks, max) => {
        const percentage = (marks / max) * 100; // Fixed percentage calc
        if (percentage >= 90) return { label: t('distinction'), color: 'var(--success)', bg: 'rgba(22, 163, 74, 0.1)' };
        if (percentage >= 75) return { label: t('firstClass'), color: 'var(--secondary)', bg: 'rgba(59, 130, 246, 0.1)' };
        if (percentage >= 60) return { label: t('secondClass'), color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.1)' };
        return { label: t('atRisk'), color: 'var(--danger)', bg: 'rgba(220, 38, 38, 0.1)' };
    };
    const getRemarks = (marks, max) => {
        const percentage = (marks / max) * 100;
        if (percentage >= 85) return t('excPerf');
        if (percentage >= 70) return t('goodUnd');
        if (percentage >= 50) return t('avgEffort');
        return t('critMeet');
    };
    const transliterateName = (name, targetLang, nameKn, mentorKn) => {
        if (targetLang === 'EN' || !name || name === 'Loading...') return name;
        if (nameKn) return nameKn;
        if (mentorKn) return mentorKn;

        const parts = name.toUpperCase().replace(/\./g, ' ').split(/\s+/);
        const translatedParts = parts.map(part => {
            // Explicit Overrides for common names and titles
            const overrides = {
                'DR': 'ಡಾ.', 'PROF': 'ಪ್ರೊ.', 'MR': 'ಶ್ರೀ', 'MRS': 'ಶ್ರೀಮತಿ', 'MISS': 'ಕುಮಾರಿ',
                'RAMESH': 'ರಮೇಶ್', 'KAVITHA': 'ಕವಿತಾ', 'ABHISHEKA': 'ಅಭಿಷೇಕ', 'SANJAY': 'ಸಂಜಯ್',
                'GOUDA': 'ಗೌಡ', 'GOWDA': 'ಗೌಡ', 'KUMAR': 'ಕುಮಾರ್', 'PATIL': 'ಪಾಟೀಲ್', 'NAIK': 'ನಾಯಕ್', 'RAO': 'ರಾವ್',
                'SANTHOSH': 'ಸಂತೋಷ್', 'MANJUNATH': 'ಮಂಜುನಾಥ್', 'SATEESH': 'ಸತೀಶ್', 'MAHALAKSHMI': 'ಮಹಾಲಕ್ಷ್ಮಿ',
                'VIJAY': 'ವಿಜಯ್', 'ANNAPURNA': 'ಅನ್ನಪೂರ್ಣ', 'SAVITHA': 'ಸವಿತಾ', 'BHAGYA': 'ಭಾಗ್ಯ', 'REKHA': 'ರೇಖಾ',
                'MAHESH': 'ಮಹೇಶ್', 'SHIVU': 'ಶಿವಪ್ಪ', 'BASAVARAJ': 'ಬಸವರಾಜ್', 'SIDDAPPA': 'ಸಿದ್ದಪ್ಪ',
                'LATHA': 'ಲತಾ', 'GIRIJA': 'ಗಿರಿಜಾ', 'ROOPA': 'ರೂಪಾ', 'DEEPA': 'ದೀಪಾ', 'SHASHIKALA': 'ಶಶಿಕಲಾ',
                'PADMA': 'ಪದ್ಮಾ', 'RADHA': 'ರಾಧಾ', 'SARASWATHI': 'ಸರಸ್ವತಿ', 'LAKSHMI': 'ಲಕ್ಷ್ಮಿ',
                'PRAKASH': 'ಪ್ರಕಾಶ್', 'MOHAN': 'ಮೋಹನ್', 'KIRAN': 'ಕಿರಣ್', 'ARUN': 'ಅರುಣ್', 'GURU': 'ಗುರು',
                'RAVI': 'ರವಿ', 'ANAND': 'ಆನಂದ್', 'VINAY': 'ವಿನಯ್', 'SUJAY': 'ಸುಜಯ್', 'PRASHANTH': 'ಪ್ರಶಾಂತ್',
                'SANDEEP': 'ಸಂದೀಪ್', 'NAVEEN': 'ನವೀನ್', 'RAGHU': 'ರಘು', 'VISHWA': 'ವಿಶ್ವ', 'CHETAN': 'ಚೇತನ್',
                'PUNEETH': 'ಪುನೀತ್', 'DARSHAN': 'ದರ್ಶನ್', 'SUDEEP': 'ಸುದೀಪ್', 'YASH': 'ಯಶ್',
                'SHETTY': 'ಶೆಟ್ಟಿ', 'HEGDE': 'ಹೆಗಡೆ', 'BHAT': 'ಭಟ್', 'PRABHU': 'ಪ್ರಭು', 'MURTHY': 'ಮೂರ್ತಿ'
            };
            if (overrides[part]) return overrides[part];
            if (part.length === 1) {
                const initialMap = { 'A':'ಎ','B':'ಬಿ','C':'ಸಿ','D':'ಡಿ','E':'ಇ','F':'ಎಫ್','G':'ಜಿ','H':'ಹೆಚ್','I':'ಐ','J':'ಜೆ','K':'ಕೆ','L':'ಎಲ್','M':'ಎಂ','N':'ಎನ್','O':'ಓ','P':'ಪಿ','Q':'ಕ್ಯೂ','R':'ಆರ್','S':'ಎಸ್','T':'ಟಿ','U':'ಯು','V':'ವಿ','W':'ಡಬ್ಲ್ಯೂ','X':'ಎಕ್ಸ್','Y':'ವೈ','Z':'ಜೆಡ್' };
                return initialMap[part] || part;
            }

            let result = part;
            // Vowel combination logic (simplified)
            const mappings = [
                ['SH', 'ಶ'], ['CH', 'ಚ'], ['TH', 'ಥ'], ['KH', 'ಖ'], ['GH', 'ಘ'], ['BH', 'ಭ'], ['DH', 'ಧ'],
                ['EE', 'ೀ'], ['OO', 'ೂ'], ['AI', 'ೈ'], ['OU', 'ೌ'],
                ['A', 'ಅ'], ['B', 'ಬ'], ['C', 'ಕ'], ['D', 'ದ'], ['E', 'ಎ'], ['F', 'ಫ'], ['G', 'ಗ'], ['H', 'ಹ'], ['I', 'ಇ'], ['J', 'ಜ'], ['K', 'ಕ'], ['L', 'ಲ'], ['M', 'ಮ'], ['N', 'ನ'], ['O', 'ಒ'], ['P', 'ಪ'], ['Q', 'ಕ'], ['R', 'ರ'], ['S', 'ಸ'], ['T', 'ಟ'], ['U', 'ಉ'], ['V', 'ವ'], ['W', 'ವ'], ['X', 'ಕ್ಷ'], ['Y', 'ಯ',], ['Z', 'ಜ']
            ];
            mappings.forEach(([key, val]) => {
                const regex = new RegExp(key, 'g');
                result = result.replace(regex, val);
            });
            return result;
        });

        return translatedParts.join(' ');
    };

    // Typewriter Effect Logic
    const [typedText, setTypedText] = useState('');
    const welcomeMessage = `${t('welcome')}, ${studentInfo.name !== 'Loading...' ? transliterateName(studentInfo.name, lang, studentInfo.nameKn) : (lang === 'KN' ? 'ವಿದ್ಯಾರ್ಥಿ' : 'Student')} 👋`;

    React.useEffect(() => {
        if (studentInfo.name === 'Loading...') return;
        let i = 0;
        setTypedText('');
        const typingInterval = setInterval(() => {
            if (i < welcomeMessage.length) {
                setTypedText(welcomeMessage.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 50); // Speed of typing
        return () => clearInterval(typingInterval);
    }, [studentInfo.name, lang, welcomeMessage]);

    const renderOverview = () => {
        // Determine the latest CIE that has any marks across all subjects
        const cieKeys = [
            { id: '5', key: 'cie5Score', att: 'cie5Att', remark: 'cie5Remark', label: 'Activity' },
            { id: '4', key: 'cie4Score', att: 'cie4Att', remark: 'cie4Remark', label: 'Skill Test 2 (Lab)' },
            { id: '3', key: 'cie3Score', att: 'cie3Att', remark: 'cie3Remark', label: 'CIE-2 (Theory)' },
            { id: '2', key: 'cie2Score', att: 'cie2Att', remark: 'cie2Remark', label: 'Skill Test 1 (Lab)' },
            { id: '1', key: 'cie1Score', att: 'cie1Att', remark: 'cie1Remark', label: 'CIE-1 (Theory)' },
        ];
        let latestCie = { key: 'cie1Score', att: 'cie1Att', remark: 'cie1Remark', label: 'CIE-1' }; // default
        for (const cie of cieKeys) {
            if (realMarks.some(m => m[cie.key] != null)) {
                latestCie = cie;
                break;
            }
        }

        // Count subjects with low marks or attendance in the latest CIE
        const mThreshold = parseInt(perfConfig.low_threshold) || 20;
        const aThreshold = parseInt(perfConfig.low_attendance_threshold) || 75;
        const eThreshold = parseInt(perfConfig.excellent_threshold) || 40;
        let lowSubjectCount = 0;
        realMarks.forEach(mark => {
            const s = mark[latestCie.key];
            const a = mark[latestCie.att];
            if ((s != null && s <= mThreshold) || (a != null && a < aThreshold)) lowSubjectCount++;
        });

        return (
            <div className={styles.detailsContainer}>
                <div className={styles.contentGrid}>
                    <div className={styles.card} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 className={styles.cardTitle} style={{ margin: 0 }}>📑 {t('currentCiePerf')}</h2>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead><tr><th>{t('subjects')}</th><th>{latestCie.label}</th><th>{t('attendance')} %</th><th>{t('totalProgress')}</th><th style={{ background: '#fefce8', color: '#a16207' }}>{t('remarks')}</th></tr></thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td><Skeleton width="150px" height="20px" /></td>
                                                <td><Skeleton width="50px" height="20px" /></td>
                                                <td><Skeleton width="50px" height="20px" /></td>
                                                <td><Skeleton width="100%" height="25px" /></td>
                                                <td><Skeleton width="150px" height="20px" /></td>
                                            </tr>
                                        ))
                                    ) : realSubjects.length > 0 ? realSubjects.map((sub, idx) => {
                                        const mark = realMarks.find(m => m.name === sub.name) || {};
                                        const total = mark.totalScore || 0;
                                        const maxMarks = 250;
                                        const cieScore = mark[latestCie.key];
                                        const cieAtt = mark[latestCie.att];
                                        const status = getStatus(cieScore || 0, 50);
                                        const progressWidth = Math.min((total / maxMarks) * 100, 100);

                                        return (
                                            <tr key={idx} style={{ animation: `fadeIn 0.4s ease-out ${idx * 0.1}s backwards` }}>
                                                <td><div className={styles.subjectCell}><span style={{ fontWeight: 600 }}>{sub.name}</span><br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sub.code}</span></div></td>
                                                 <td>{cieScore === -2.0 ? 'AB' : (cieScore != null ? cieScore + '/50' : '-')}</td>
                                                <td>{cieAtt != null ? cieAtt + '%' : '-'}</td>
                                                <td style={{ minWidth: '150px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                        <span>{total} / {maxMarks}</span>
                                                        <span style={{ fontWeight: 600 }}>{Math.round(progressWidth)}%</span>
                                                    </div>
                                                    <div className={styles.progressContainer}>
                                                        <div className={styles.progressBar} style={{ width: `${progressWidth}%`, background: status.color }}></div>
                                                    </div>
                                                </td>
                                                {(() => {
                                                    const score = cieScore != null ? parseFloat(cieScore) : null;
                                                    const att = cieAtt != null ? parseFloat(cieAtt) : null;
                                                    const customRemark = mark[latestCie.remark];
                                                    if (score == null) return <td style={{ width: '250px', minWidth: '250px', padding: 0 }}><div style={{ fontSize: '0.72rem', color: '#94a3b8', padding: '8px 4px' }}>-</div></td>;
                                                     if (score === -2.0) return <td style={{ width: '250px', minWidth: '250px', padding: '8px 4px', background: '#fef2f2' }}><div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#dc2626' }}>{t('absent')}</div></td>;
                                                    const isLowMarks = score <= mThreshold;
                                                    const isLowAtt = att != null && att < aThreshold;
                                                    const isLow = isLowMarks || isLowAtt;
                                                    let remark = ''; let color = '#64748b'; let bg = 'transparent';
                                                    if (customRemark) {
                                                        remark = customRemark;
                                                        color = '#4f46e5'; bg = '#eef2ff'; // Indigo for HOD custom remarks
                                                    } else if (isLow && lowSubjectCount >= 3) {
                                                        remark = isLowMarks && isLowAtt ? `${latestCie.label}: ${t('lowMarksAndAtt')} - ${t('meetHod')}` : isLowMarks ? `${latestCie.label}: ${t('lowMarks')} - ${t('meetHod')}` : `${latestCie.label}: ${t('lowAtt')} - ${t('meetHod')}`;
                                                        color = '#dc2626'; bg = '#fef2f2';
                                                    } else if (isLow && lowSubjectCount >= 2) {
                                                        remark = isLowMarks && isLowAtt ? `${latestCie.label}: ${t('lowMarksAndAtt')} - ${t('contactMentor')}` : isLowMarks ? `${latestCie.label}: ${t('lowMarks')} - ${t('contactMentor')}` : `${latestCie.label}: ${t('lowAtt')} - ${t('contactMentor')}`;
                                                        color = '#ea580c'; bg = '#fff7ed';
                                                    } else if (isLow) {
                                                        remark = isLowMarks && isLowAtt ? `${latestCie.label}: ${t('lowMarksAndAtt')}` : isLowMarks ? `${latestCie.label}: ${t('lowMarks')}` : `${latestCie.label}: ${t('lowAtt')}`;
                                                        color = '#ea580c'; bg = '#fff7ed';
                                                    } else if (score >= eThreshold && (att == null || att >= aThreshold)) {
                                                        remark = t('excellent'); color = '#15803d'; bg = '#f0fdf4';
                                                    } else {
                                                        remark = t('good'); color = '#2563eb'; bg = '#eff6ff';
                                                    }
                                                    return <td style={{ width: '250px', minWidth: '250px', padding: '8px 4px', background: bg }}>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color, whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.4' }}>{remark}</div>
                                                    </td>;
                                                })()}
                                            </tr>
                                        );
                                    }) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>{t('loading')}</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <AcademicInsights realMarks={realMarks} loading={loading} t={t} />
                </div>

                {/* Conditional Remarks Section */}
                {!loading && realMarks.length > 0 && (() => {
                    // Count subjects with low marks or attendance in the latest CIE
                    let lowSubjectsCount = 0;
                    const lowSubjectNames = [];
                    realMarks.forEach(mark => {
                        const score = mark[latestCie.key];
                        const att = mark[latestCie.att];
                        if ((score != null && score <= mThreshold) || (att != null && att < aThreshold)) {
                            lowSubjectsCount++;
                            lowSubjectNames.push(mark.name);
                        }
                    });

                    let overallMessage = null;
                    let messageColor = '#15803d';
                    let messageBg = '#f0fdf4';
                    let messageBorder = '#bbf7d0';

                    if (lowSubjectsCount >= 3) {
                        overallMessage = `⚠️ ${t('lowMarksOrAttIn')} ${lowSubjectsCount} ${t('subjectsPlural')} (${lowSubjectNames.join(', ')}). ${t('meetHodImmediate')}`;
                        messageColor = '#dc2626';
                        messageBg = '#fef2f2';
                        messageBorder = '#fecaca';
                    } else if (lowSubjectsCount >= 2) {
                        overallMessage = `📋 ${t('lowMarksOrAttIn')} ${lowSubjectsCount} ${t('subjectsPlural')} (${lowSubjectNames.join(', ')}). ${t('contactMentorGuidance')}`;
                        messageColor = '#ea580c';
                        messageBg = '#fff7ed';
                        messageBorder = '#fed7aa';
                    }

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {overallMessage && (
                                <div className={styles.card} style={{ border: `1px solid ${messageBorder}`, background: messageBg, animationDelay: '0.3s' }}>
                                    <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <AlertCircle size={24} style={{ color: messageColor, flexShrink: 0, marginTop: '2px' }} />
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: messageColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('remarks')}</span>
                                            <p style={{ margin: '4px 0 0 0', color: messageColor, fontWeight: 600, fontSize: '0.95rem' }}>{overallMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {studentInfo.overallRemarks && (
                                <div className={styles.card} style={{ border: '1px solid #c7d2fe', background: '#eef2ff', animationDelay: '0.4s' }}>
                                    <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FileText size={20} style={{ color: '#4f46e5', flexShrink: 0 }} />
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase' }}>HOD {t('remarks')}</span>
                                            <p style={{ margin: '4px 0 0 0', color: '#3730a3', fontWeight: 500 }}>{studentInfo.overallRemarks}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        );
    };

    // ... (rest of render functions remain mostly same but can benefit from global CSS updates)

    const downloadCIEMarks = (subjects, filter) => {
        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(18);
        doc.setTextColor(30, 58, 138); // Academic Blue
        doc.text(t('cieMarks').toUpperCase() + ' REPORT', 105, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Sanjay Gandhi Polytechnic CIE Management System', 105, 22, { align: 'center' });

        // Add Student Info
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Student Name: ${studentInfo.name}`, 14, 35);
        doc.text(`Registration No: ${studentInfo.rollNo}`, 14, 40);
        doc.text(`Department: ${studentInfo.branch}`, 14, 45);
        doc.text(`${t('semester')}: ${selectedSemester}`, 14, 50);
        doc.text(`Internals: ${filter}`, 14, 55);
        doc.text(`Date of Generation: ${new Date().toLocaleDateString()}`, 14, 60);

        let tableHeaders = [['Code', 'Subject']];
        if (filter === 'All') {
            tableHeaders[0].push('C1', 'A1', 'C2', 'A2', 'C3', 'A3', 'C4', 'A4', 'C5', 'A5');
        } else {
            tableHeaders[0].push('Marks', 'Attendance');
        }
        tableHeaders[0].push('Total');

        const tableRows = subjects.map(item => {
            const fmtPdf = (val) => val === -2.0 ? 'AB' : (val != null ? (val === '-' ? '-' : val) : '-');
            const row = [item.code, item.subject];
            if (filter === 'All') {
                row.push(fmtPdf(item.cie1), item.cie1Att, fmtPdf(item.cie2), item.cie2Att, fmtPdf(item.cie3), item.cie3Att, fmtPdf(item.cie4), item.cie4Att, fmtPdf(item.cie5), item.cie5Att);
            } else {
                let score = '-';
                let att = '-';
                if (filter === 'CIE-1 (Theory)') { score = fmtPdf(item.cie1); att = item.cie1Att; }
                else if (filter === 'Skill Test 1 (Lab)') { score = fmtPdf(item.cie2); att = item.cie2Att; }
                else if (filter === 'CIE-2 (Theory)') { score = fmtPdf(item.cie3); att = item.cie3Att; }
                else if (filter === 'Skill Test 2 (Lab)') { score = fmtPdf(item.cie4); att = item.cie4Att; }
                else if (filter === 'Activity') { score = fmtPdf(item.cie5); att = item.cie5Att; }
                row.push(score, att);
            }
            row.push(item.total);
            return row;
        });

        autoTable(doc, {
            startY: 70,
            head: tableHeaders,
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { top: 70 }
        });

        doc.save(`CIE_Marks_${studentInfo.rollNo}_${filter.replace('-', '_')}.pdf`);
    };

    const renderCIEMarks = () => {
        const theorySubjects = [];
        let hasDataForSelectedCIE = false;

        const mThr = parseInt(perfConfig.low_threshold) || 20;
        const aThr = parseInt(perfConfig.low_attendance_threshold) || 75;
        const eThr = parseInt(perfConfig.excellent_threshold) || 40;

        realSubjects.forEach(sub => {
            if (sub.semester && sub.semester.toString() !== selectedSemester) return;
            const mark = realMarks.find(m => m.name === sub.name) || {};

            if (selectedCIE === 'All') {
                if (mark.cie1Score != null || mark.cie2Score != null || mark.cie3Score != null || mark.cie4Score != null || mark.cie5Score != null) hasDataForSelectedCIE = true;
            } else {
                const check = (selectedCIE === 'CIE-1 (Theory)' && mark.cie1Score != null) ||
                    (selectedCIE === 'Skill Test 1 (Lab)' && mark.cie2Score != null) ||
                    (selectedCIE === 'CIE-2 (Theory)' && mark.cie3Score != null) ||
                    (selectedCIE === 'Skill Test 2 (Lab)' && mark.cie4Score != null) ||
                    (selectedCIE === 'Activity' && mark.cie5Score != null);
                if (check) hasDataForSelectedCIE = true;
            }

            const fmt = (val) => val != null ? val : '-';

            theorySubjects.push({
                code: sub.code,
                subject: sub.name,
                cie1: fmt(mark.cie1Score),
                cie2: fmt(mark.cie2Score),
                cie3: fmt(mark.cie3Score),
                cie4: fmt(mark.cie4Score),
                cie5: fmt(mark.cie5Score),
                cie1Att: fmt(mark.cie1Att),
                cie2Att: fmt(mark.cie2Att),
                cie3Att: fmt(mark.cie3Att),
                cie4Att: fmt(mark.cie4Att),
                cie5Att: fmt(mark.cie5Att),
                cie1Remark: mark.cie1Remark,
                cie2Remark: mark.cie2Remark,
                cie3Remark: mark.cie3Remark,
                cie4Remark: mark.cie4Remark,
                cie5Remark: mark.cie5Remark,
                total: mark.totalScore || 0
            });
        });

        const isRestricted = (Number(selectedSemester) < Number(studentInfo.semester)) ||
            (semesterStatus === 'COMPLETED' && Number(selectedSemester) === Number(studentInfo.semester));

        return (
            <div className={styles.detailsContainer}>
                {isRestricted && (
                    <div className={styles.card} style={{ marginBottom: '1rem', background: '#fefce8', borderLeft: '4px solid #eab308' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem' }}>
                            <AlertCircle size={20} style={{ color: '#a16207' }} />
                            <span style={{ color: '#854d0e', fontSize: '0.9rem', fontWeight: 500 }}>
                                {Number(selectedSemester) < Number(studentInfo.semester)
                                    ? `Semester ${selectedSemester} is archived. Displaying Total Marks only.`
                                    : "The current semester is completed. Displaying Total Marks only."}
                            </span>
                        </div>
                    </div>
                )}
                <div className={styles.card} style={{ marginBottom: '1.5rem', animationDelay: '0.1s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div className={styles.selectionRow} style={{ flex: 1 }}>
                            <div className={styles.selectionGroup}><label className={styles.selectionLabel}>{t('selectSem')}:</label><select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className={styles.filterSelect}>{[1, 2, 3, 4, 5, 6].map(sem => <option key={sem} value={sem}>{t('semester')} {sem}</option>)}</select></div>
                            <div className={styles.selectionGroup}><label className={styles.selectionLabel}>{t('selectInternals')}:</label>
                                <select value={selectedCIE} onChange={(e) => setSelectedCIE(e.target.value)} className={styles.filterSelect}>
                                    <option value="All">{t('allInternals')}</option>
                                    <option value="CIE-1 (Theory)">CIE-1 (Theory)</option>
                                    <option value="Skill Test 1 (Lab)">Skill Test 1 (Lab)</option>
                                    <option value="CIE-2 (Theory)">CIE-2 (Theory)</option>
                                    <option value="Skill Test 2 (Lab)">Skill Test 2 (Lab)</option>
                                    <option value="Activity">Activity</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={() => downloadCIEMarks(theorySubjects, selectedCIE)} className={styles.actionBtn} style={{ padding: '0.5rem 1rem' }}><FileText size={16} /> {t('downloadPdf')}</button>
                    </div>
                </div>

                {!hasDataForSelectedCIE && selectedCIE !== 'All' ? (
                    <div className={styles.card} style={{ animationDelay: '0.2s', textAlign: 'center', padding: '3rem' }}>
                        <div style={{ background: '#fef2f2', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: '#ef4444' }}><AlertCircle size={32} /></div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>{t('noMarksUploaded')}</h3>
                        <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
                            {t('facultyNotUploaded')}
                        </p>
                    </div>
                ) : (
                    <div className={styles.card} style={{ animationDelay: '0.2s' }}>
                        <div className={styles.cardHeader}><h2 className={styles.cardTitle}>📘 {t('subjects')}</h2></div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>{t('subjects')}</th>
                                        {selectedCIE === 'All' ? (
                                            <>
                                                <th>CIE-1 (T)</th><th>{t('attendance').substring(0, 3)}</th>
                                                <th>ST-1 (L)</th><th>{t('attendance').substring(0, 3)}</th>
                                                <th>CIE-2 (T)</th><th>{t('attendance').substring(0, 3)}</th>
                                                <th>ST-2 (L)</th><th>{t('attendance').substring(0, 3)}</th>
                                                <th>Activity</th><th>{t('attendance').substring(0, 3)}</th>
                                            </>
                                        ) : (
                                            <><th>{t('marks')} ({selectedCIE})</th><th>{t('attendance')}</th></>
                                        )}
                                        <th>{t('totalProgress')} (250)</th>
                                        <th style={{ background: '#fefce8', color: '#a16207' }}>{t('remarks')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {theorySubjects.map((row, idx) => {
                                        const getCieRemark = (v, a, label) => {
                                            if (v == null || isNaN(v) || a == null || isNaN(a)) return null;

                                            const isLowMarks = v <= mThr;
                                            const isLowAtt = a < aThr;
                                            const isExcellent = v >= eThr && a >= aThr;
                                            
                                            let text = '';
                                            if (isLowMarks && isLowAtt) { text = t('lowMarksAndAtt'); }
                                            else if (isLowMarks) { text = t('lowMarks'); }
                                            else if (isLowAtt) { text = t('lowAtt'); }
                                            else if (isExcellent) { text = `${label}: ${t('excellent')}`; }
                                            else { text = `${label}: Good`; }

                                            return {
                                                label,
                                                lowMarks: isLowMarks,
                                                lowAtt: isLowAtt,
                                                excellent: isExcellent,
                                                severity: (isLowMarks && isLowAtt) ? 3 : (isLowMarks ? 2 : (isLowAtt ? 2 : 0)),
                                                text
                                            };
                                        };

                                        const allCies = [
                                            row.cie1Remark ? { label: 'CIE-1 (Theory)', text: row.cie1Remark, severity: 1, excellent: false, lowMarks: false, lowAtt: false, custom: true } : getCieRemark(row.cie1 !== '-' ? parseFloat(row.cie1) : null, row.cie1Att !== '-' ? parseFloat(row.cie1Att) : null, 'CIE-1 (Theory)'),
                                            row.cie2Remark ? { label: 'Skill Test 1 (Lab)', text: row.cie2Remark, severity: 1, excellent: false, lowMarks: false, lowAtt: false, custom: true } : getCieRemark(row.cie2 !== '-' ? parseFloat(row.cie2) : null, row.cie2Att !== '-' ? parseFloat(row.cie2Att) : null, 'Skill Test 1 (Lab)'),
                                            row.cie3Remark ? { label: 'CIE-2 (Theory)', text: row.cie3Remark, severity: 1, excellent: false, lowMarks: false, lowAtt: false, custom: true } : getCieRemark(row.cie3 !== '-' ? parseFloat(row.cie3) : null, row.cie3Att !== '-' ? parseFloat(row.cie3Att) : null, 'CIE-2 (Theory)'),
                                            row.cie4Remark ? { label: 'Skill Test 2 (Lab)', text: row.cie4Remark, severity: 1, excellent: false, lowMarks: false, lowAtt: false, custom: true } : getCieRemark(row.cie4 !== '-' ? parseFloat(row.cie4) : null, row.cie4Att !== '-' ? parseFloat(row.cie4Att) : null, 'Skill Test 2 (Lab)'),
                                            row.cie5Remark ? { label: 'Activity', text: row.cie5Remark, severity: 1, excellent: false, lowMarks: false, lowAtt: false, custom: true } : getCieRemark(row.cie5 !== '-' ? parseFloat(row.cie5) : null, row.cie5Att !== '-' ? parseFloat(row.cie5Att) : null, 'Activity')
                                        ];
                                        const filled = allCies.filter(r => r !== null);

                                        let finalRemark = '-';
                                        let finalColor = '#94a3b8';
                                        let finalBg = 'transparent';

                                        if (selectedCIE === 'All' && filled.length > 0) {
                                            const worst = Math.max(...filled.map(r => r.severity));
                                            finalColor = worst >= 3 ? '#dc2626' : worst >= 2 ? '#ea580c' : '#15803d';
                                            finalBg = worst >= 3 ? '#fef2f2' : worst >= 2 ? '#fff7ed' : '#f0fdf4';

                                            const lowMarksCies = filled.filter(r => r.lowMarks).map(r => r.label);
                                            const lowAttCies = filled.filter(r => r.lowAtt).map(r => r.label);

                                            let textParts = [];
                                            if (lowMarksCies.length > 0) textParts.push(`${lowMarksCies.join(',')} Low Marks`);
                                            if (lowAttCies.length > 0) textParts.push(`${lowAttCies.join(',')} Low Att`);
                                            
                                            const hasCustom = filled.some(r => r.custom);
                                            if (hasCustom) {
                                                const customTexts = filled.filter(r => r.custom).map(r => r.text);
                                                finalRemark = customTexts.join(' | ');
                                                finalColor = '#4f46e5'; finalBg = '#eef2ff';
                                            } else if (textParts.length === 0) {
                                                const allExcellent = filled.every(r => r.excellent);
                                                textParts.push(allExcellent ? 'All Excellent' : 'All Good');
                                                finalRemark = textParts.join(' | ');
                                            } else {
                                                finalRemark = textParts.join(' | ');
                                            }
                                        } else if (selectedCIE !== 'All') {
                                            let target = null;
                                            if (selectedCIE === 'CIE-1 (Theory)') target = allCies[0];
                                            else if (selectedCIE === 'Skill Test 1 (Lab)') target = allCies[1];
                                            else if (selectedCIE === 'CIE-2 (Theory)') target = allCies[2];
                                            else if (selectedCIE === 'Skill Test 2 (Lab)') target = allCies[3];
                                            else if (selectedCIE === 'Activity') target = allCies[4];

                                            if (target) {
                                                finalRemark = target.text;
                                                if (target.custom) {
                                                    finalColor = '#4f46e5'; finalBg = '#eef2ff';
                                                } else {
                                                    finalColor = target.severity >= 3 ? '#dc2626' : target.severity >= 2 ? '#ea580c' : target.severity === 0 ? '#15803d' : '#2563eb';
                                                    finalBg = target.severity >= 3 ? '#fef2f2' : target.severity >= 2 ? '#fff7ed' : '#f0fdf4';
                                                }
                                            }
                                        }

                                        return (
                                            <tr key={idx} style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s backwards` }}>
                                                <td><div className={styles.subjectCell}><span style={{ fontWeight: 600 }}>{row.subject}</span><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.code}</span></div></td>
                                                {selectedCIE === 'All' ? (
                                                    <>
                                                        <td>{row.cie1 !== '-' ? (row.cie1 === -2.0 ? 'AB' : row.cie1 + '/50') : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie1Att !== '-' ? row.cie1Att + '%' : '-'}</span></td>
                                                        <td>{row.cie2 !== '-' ? (row.cie2 === -2.0 ? 'AB' : row.cie2 + '/50') : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie2Att !== '-' ? row.cie2Att + '%' : '-'}</span></td>
                                                        <td>{row.cie3 !== '-' ? (row.cie3 === -2.0 ? 'AB' : row.cie3 + '/50') : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie3Att !== '-' ? row.cie3Att + '%' : '-'}</span></td>
                                                        <td>{row.cie4 !== '-' ? (row.cie4 === -2.0 ? 'AB' : row.cie4 + '/50') : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie4Att !== '-' ? row.cie4Att + '%' : '-'}</span></td>
                                                        <td>{row.cie5 !== '-' ? (row.cie5 === -2.0 ? 'AB' : row.cie5 + '/50') : '-'}</td><td><span style={{ fontSize: '0.72rem' }}>{row.cie5Att !== '-' ? row.cie5Att + '%' : '-'}</span></td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td>
                                                            {(() => { 
                                                                let rawScore = '-';
                                                                if (selectedCIE === 'CIE-1 (Theory)') rawScore = row.cie1;
                                                                else if (selectedCIE === 'Skill Test 1 (Lab)') rawScore = row.cie2;
                                                                else if (selectedCIE === 'CIE-2 (Theory)') rawScore = row.cie3;
                                                                else if (selectedCIE === 'Skill Test 2 (Lab)') rawScore = row.cie4;
                                                                else if (selectedCIE === 'Activity') rawScore = row.cie5;

                                                                if (rawScore === -2.0) return 'AB';
                                                                return rawScore !== '-' ? rawScore + '/50' : '-';
                                                            })()}
                                                        </td>
                                                        <td>
                                                            {(() => {
                                                                let att = '-';
                                                                if (selectedCIE === 'CIE-1 (Theory)') att = row.cie1Att;
                                                                else if (selectedCIE === 'Skill Test 1 (Lab)') att = row.cie2Att;
                                                                else if (selectedCIE === 'CIE-2 (Theory)') att = row.cie3Att;
                                                                else if (selectedCIE === 'Skill Test 2 (Lab)') att = row.cie4Att;
                                                                else if (selectedCIE === 'Activity') att = row.cie5Att;
                                                                return att !== '-' ? att + '%' : '-';
                                                            })()}
                                                        </td>
                                                    </>
                                                )}
                                                <td style={{ fontWeight: 700, color: 'var(--accent-indigo)' }}>{row.total} / 250</td>
                                         <td>
                                             {finalRemark !== '-' ? (
                                                 <div style={{ fontSize: '0.65rem', padding: '6px 4px', fontWeight: 600, color: finalColor, background: finalBg, borderRadius: '6px', whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.4', minWidth: '150px' }}>{finalRemark}</div>
                                             ) : (
                                                 <div style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '6px 10px', textAlign: 'center' }}>-</div>
                                             )}
                                         </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };



    // ... (rest of the file as is, just wrapped in render)

    const renderSubjects = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.card} style={{ animationDelay: '0.1s' }}>
                <div className={styles.cardHeader}><h2 className={styles.cardTitle}>📚 {t('subjects')}</h2></div>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead><tr><th>{t('subjectCode')}</th><th>{t('subjectName')}</th><th>{t('branch')}</th><th>{t('semester')}</th></tr></thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton width="80px" height="24px" /></td>
                                        <td><Skeleton width="200px" height="20px" /></td>
                                        <td><Skeleton width="100px" height="20px" /></td>
                                        <td><Skeleton width="40px" height="20px" /></td>
                                    </tr>
                                ))
                            ) : realSubjects.length > 0 ? realSubjects.map((sub, idx) => (
                                <tr key={idx} style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s backwards` }}>
                                    <td><span className={styles.codeBadge}>{sub.code}</span></td>
                                    <td><span style={{ fontWeight: 600 }}>{sub.name}</span></td>
                                    <td>{sub.department}</td><td>{sub.semester}</td>
                                </tr>
                            )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>{t('noSubjects')}.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderFaculty = () => (
        <div className={styles.detailsContainer}>
            <div className={styles.facultyGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', animation: 'fadeIn 0.8s ease-out' }}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className={styles.facultyCard}>
                            <Skeleton variant="circle" width="64px" height="64px" style={{ marginBottom: '1rem' }} />
                            <Skeleton width="140px" height="24px" style={{ marginBottom: '0.5rem' }} />
                            <Skeleton width="100px" height="16px" style={{ marginBottom: '1rem' }} />
                            <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.75rem 0' }}></div>
                            <Skeleton width="180px" height="16px" style={{ marginBottom: '0.5rem' }} />
                            <Skeleton width="80px" height="16px" />
                        </div>
                    ))
                ) : facultyList.length > 0 ? facultyList.map((fac, idx) => (
                    <div key={idx} className={styles.facultyCard} style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s backwards` }}>
                        <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: '#3b82f6', border: '1px solid #bfdbfe' }}><User size={32} /></div>
                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: '700' }}>{transliterateName(fac.name, lang, fac.nameKn || fac.name_kn)}</h3>
                        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.8 }}>{lang === 'KN' ? (fac.department === 'CSE' ? 'ಸಿಎಸ್‌ಇ' : fac.department === 'ISE' ? 'ಐಎಸ್‌ಇ' : fac.department === 'ECE' ? 'ಇಸಿಇ' : fac.department === 'ME' ? 'ಮೆಕ್' : fac.department) : fac.department} {t('branch')}</p>
                        <div style={{ width: '100%', height: '1px', background: 'var(--border-color)', margin: '0.75rem 0' }}></div>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.9 }}><span style={{ fontWeight: 600 }}>{t('teaches')}:</span> {fac.subjects}</p>
                        {fac.email && <a href={`mailto:${fac.email}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontSize: '0.85rem', textDecoration: 'none', marginTop: 'auto', fontWeight: '500' }}><Mail size={14} /> {t('contact')}</a>}
                    </div>
                )) : <div style={{ textAlign: 'center', padding: '3rem', width: '100%', gridColumn: '1/-1' }}><p>No faculty details available.</p></div>}
            </div>
        </div>
    );

    const renderSyllabusTopics = () => {
        const updates = upcomingExams.filter(exam => exam.syllabus && exam.syllabus.trim() !== '');
        return (
            <div className={styles.detailsContainer}>
                <div className={styles.card} style={{ animationDelay: '0.1s' }}>
                    <h2 className={styles.cardTitle}>📖 {t('syllabusNotif')}</h2>
                    {updates.length === 0 ? <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>{t('noSyllabusUpdates')}.</p> :
                        <div className={styles.notificationsList}>
                            {updates.map((item, idx) => (
                                <div key={idx} className={styles.notifItem} style={{ borderLeft: '4px solid #3b82f6', background: '#eff6ff', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', animation: `slideUp 0.4s ease-out ${idx * 0.1}s backwards` }}>
                                    <div className={styles.notifContent}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <div><span style={{ fontWeight: '600', color: '#1e40af', display: 'block' }}>{item.subject}</span><span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{item.exam}</span></div>
                                        </div>
                                        <div style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dbeafe' }}><p style={{ color: '#334155', margin: 0 }}>{item.syllabus}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>
        );
    };

    const renderProfile = () => {
        const initials = studentInfo.name ? studentInfo.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';

        const personalCards = [
            { icon: <User size={24} />, label: t('name'), value: lang === 'KN' ? (studentInfo.nameKn || transliterateName(studentInfo.name, lang)) : studentInfo.name, bg: '#eff6ff', iconColor: '#2563eb' },
            { icon: <Hash size={24} />, label: t('regNo'), value: studentInfo.rollNo, bg: '#f0fdf4', iconColor: '#059669' },
            { icon: <Mail size={24} />, label: 'Email Address', value: studentInfo.email || '-', bg: '#fef3c7', iconColor: '#d97706' },
        ];

        const academicCards = [
            { icon: <Building size={24} />, label: t('branch'), value: studentInfo.branch, bg: '#fce7f3', iconColor: '#be185d' },
            { icon: <GraduationCap size={24} />, label: t('semester'), value: `Semester ${studentInfo.semester}`, bg: '#ecfdf5', iconColor: '#059669' },
            { icon: <Layers size={24} />, label: 'Section', value: studentInfo.section || 'Not Assigned', bg: '#fff7ed', iconColor: '#ea580c' },
        ];

        const additionalCards = [
            { icon: <Phone size={24} />, label: 'Parent Phone', value: studentInfo.parentPhone || '-', bg: '#f3e8ff', iconColor: '#7c3aed' },
            { icon: <Shield size={24} />, label: t('assignedMentorLabel'), value: lang === 'KN' ? (studentInfo.mentorKn || transliterateName(studentInfo.mentor, lang)) : studentInfo.mentor, bg: '#e0f2fe', iconColor: '#0369a1' },
        ];

        return (
            <div className={styles.detailsContainer}>
                <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Premium Profile Header */}
                    <div className={styles.profileHeader}>
                        <div className={styles.headerInfo}>
                            <div className={styles.avatarLarge}>
                                {initials}
                            </div>
                            <div>
                                <h1 className={styles.headerName}>
                                    {lang === 'KN' ? (studentInfo.nameKn || transliterateName(studentInfo.name, lang)) : studentInfo.name}
                                </h1>
                                <p className={styles.headerSubtext}>
                                    <GraduationCap size={16} /> {studentInfo.branch} | {t('regNo')}: {studentInfo.rollNo}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        {/* Personal Information */}
                        <div className={styles.sectionHeader}>
                            <User size={18} /> Personal Information
                            <div className={styles.sectionLine} />
                        </div>
                        <div className={styles.profileGrid}>
                            {personalCards.map((card, i) => (
                                <div key={i} className={styles.profileDetailCard}>
                                    <div className={styles.profileDetailIcon} style={{ background: card.bg, color: card.iconColor }}>{card.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={styles.profileDetailLabel}>{card.label}</div>
                                        <div className={styles.profileDetailValue}>{card.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Academic Details */}
                        <div className={styles.sectionHeader} style={{ marginTop: '2.5rem' }}>
                            <GraduationCap size={18} /> Academic Details
                            <div className={styles.sectionLine} />
                        </div>
                        <div className={styles.profileGrid}>
                            {academicCards.map((card, i) => (
                                <div key={i} className={styles.profileDetailCard}>
                                    <div className={styles.profileDetailIcon} style={{ background: card.bg, color: card.iconColor }}>{card.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={styles.profileDetailLabel}>{card.label}</div>
                                        <div className={styles.profileDetailValue}>{card.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Additional Information */}
                        <div className={styles.sectionHeader} style={{ marginTop: '2.5rem' }}>
                            <Info size={18} /> Additional Information
                            <div className={styles.sectionLine} />
                        </div>
                        <div className={styles.profileGrid}>
                            {additionalCards.map((card, i) => (
                                <div key={i} className={styles.profileDetailCard}>
                                    <div className={styles.profileDetailIcon} style={{ background: card.bg, color: card.iconColor }}>{card.icon}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className={styles.profileDetailLabel}>{card.label}</div>
                                        <div className={styles.profileDetailValue}>{card.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Help */}
                        <div className={styles.footerInfo} style={{ marginTop: '3rem' }}>
                            <Info size={16} /> {t('contactMentorGuidance')}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderNotifications = () => (
        <div className={styles.detailsContainer}>
            {/* Upcoming Exams Section in Notifications Tab */}
            <div className={styles.card} style={{ animationDelay: '0.05s', marginBottom: '1.5rem' }}>
                <h2 className={styles.cardTitle}>📅 {t('upcomingExams')}</h2>
                <div className={styles.examsList}>
                    {loadingAnnouncements ? <p>{t('loadingSchedule')}</p> : upcomingExams.length > 0 ? upcomingExams.map((exam, idx) => (
                        <div key={exam.id} className={styles.examItem} style={{ animationDelay: `${0.1 * idx}s` }}>
                            <div className={styles.examBadge}>{exam.exam}</div>
                            <div className={styles.examInfo}><span className={styles.examSubject}>{exam.subject}</span><span className={styles.examDate}><Calendar size={12} /> {exam.date} • {exam.time} • Room: {exam.room}</span></div>
                            <Clock size={16} className={styles.examIcon} />
                        </div>
                    )) : <p style={{ color: '#6b7280', padding: '1rem' }}>{t('noExams')}.</p>}
                </div>
            </div>

            {/* General Notifications Section */}
            <div className={styles.card} style={{ animationDelay: '0.1s' }}>
                <h2 className={styles.cardTitle}>🔔 {t('generalNotif')}</h2>
                <div className={styles.notificationsList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    {notifications.length > 0 ? notifications.map((notif, idx) => (
                        <div key={notif.id} className={styles.notifItem} style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: notif.type === 'alert' ? '#fef2f2' : '#f0f9ff',
                            border: `1px solid ${notif.type === 'alert' ? '#fecaca' : '#bae6fd'}`,
                            display: 'flex',
                            gap: '1rem',
                            animation: `slideUp 0.3s ease-out ${idx * 0.1}s backwards`
                        }}>
                            <div style={{ color: notif.type === 'alert' ? '#dc2626' : '#0284c7' }}>
                                {notif.type === 'alert' ? <AlertCircle size={24} /> : <Bell size={24} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 0.5rem 0', color: '#334155', lineHeight: '1.5' }}>{notif.message}</p>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{notif.time}</span>
                            </div>
                        </div>
                    )) : (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>{t('noNotif')}.</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout menuItems={menuItems}>
            <div className={styles.dashboardContainer}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.welcomeText}>
                            {loading ? (
                                <Skeleton width="300px" height="40px" />
                            ) : activeSection === 'Overview' ? (
                                <span key={lang} className={styles.typewriter}>{typedText}</span>
                            ) : (
                                (activeSection === 'CIE Marks' ? t('cieMarks') : (t(activeSection.toLowerCase().replace(' ', '')) || activeSection)).toUpperCase()
                            )}
                        </h1>
                        <p className={styles.subtitle}>
                            {loading ? (
                                <Skeleton width="250px" height="20px" style={{ marginTop: '8px' }} />
                            ) : (
                                <>{studentInfo.branch} | {t('semester')}: {studentInfo.semester} | {t('regNo')}: {studentInfo.rollNo} | {t('name')}: {lang === 'KN' ? (studentInfo.nameKn || transliterateName(studentInfo.name, lang)) : studentInfo.name}</>
                            )}
                        </p>
                    </div>
                    <div className={styles.headerRight}>
                        <button 
                            className={styles.langToggle} 
                            onClick={toggleLang}
                            title={lang === 'EN' ? 'Change to Kannada' : 'Change to English'}
                        >
                            {lang === 'EN' ? 'ಕನ್ನಡ' : 'EN'}
                        </button>
                    </div>
                </header>

                {activeSection === 'Overview' && (() => {
                    const cieKeysArr = [
                        { id: '5', key: 'cie5Score', label: 'Activity' },
                        { id: '4', key: 'cie4Score', label: 'Skill Test 2 (Lab)' },
                        { id: '3', key: 'cie3Score', label: 'CIE-2 (Theory)' },
                        { id: '2', key: 'cie2Score', label: 'Skill Test 1 (Lab)' },
                        { id: '1', key: 'cie1Score', label: 'CIE-1 (Theory)' },
                    ];
                    let latestCieKey = { id: '1', key: 'cie1Score', label: 'CIE-1' };
                    for (const cie of cieKeysArr) {
                        if (realMarks.some(m => m[cie.key] != null)) {
                            latestCieKey = cie;
                            break;
                        }
                    }

                    const cieTargetTotalPossible = realSubjects.length * 50;
                    let cieTargetObtained = 0;
                    let pendingUploadsCount = 0;

                    realSubjects.forEach(sub => {
                        const m = realMarks.find(mark => mark.name === sub.name);
                        const score = m ? m[latestCieKey.key] : null;
                        
                        if (score === null || score === undefined) {
                            pendingUploadsCount++;
                        } else if (score !== -2.0) {
                            cieTargetObtained += (parseFloat(score) || 0);
                        }
                    });

                    const cieOverview = {
                        obtained: cieTargetObtained,
                        total: cieTargetTotalPossible,
                        pending: pendingUploadsCount,
                        label: latestCieKey.label
                    };

                    return (
                        <AcademicSummary
                            studentInfo={{
                                ...studentInfo,
                                mentor: lang === 'KN' ? (studentInfo.mentorKn || transliterateName(studentInfo.mentor, lang)) : studentInfo.mentor
                            }}
                            cieStatus={cieStatus}
                            loading={loading}
                            t={t}
                            cieOverview={cieOverview}
                            riskLevel={
                                (parseFloat(studentInfo.cgpa) < 40 || (studentInfo.avgAttendance && studentInfo.avgAttendance < 75)) ? 'High' :
                                    parseFloat(studentInfo.cgpa) < 60 ? 'Moderate' : 'Low'
                            }
                        />
                    );
                })()}

                {activeSection === 'Overview' && renderOverview()}
                {activeSection === 'CIE Marks' && renderCIEMarks()}

                {activeSection === 'Subjects' && renderSubjects()}
                {activeSection === 'Faculty' && renderFaculty()}
                {activeSection === 'Syllabus Topics' && renderSyllabusTopics()}
                {activeSection === 'Notifications' && renderNotifications()}
                {activeSection === 'Profile' && renderProfile()}

                {toast.show && <div className={styles.toast}>{toast.message}</div>}
            </div>
        </DashboardLayout>
    );
};
export default StudentDashboard;
