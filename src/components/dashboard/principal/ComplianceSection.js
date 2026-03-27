import React, { useState, useMemo, useCallback, memo } from 'react';
import { Bell } from 'lucide-react';
import styles from '../../../pages/PrincipalDashboard.module.css';
import Skeleton from '../../ui/Skeleton';

const determineColor = (val) => {
    if (val >= 90) return '#16a34a';
    if (val >= 50) return '#f59e0b';
    return '#ef4444';
};

const ComplianceSection = memo(({ hodSubmissionStatus = [], loading }) => {
    const [filter, setFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [selectedDeptDetails, setSelectedDeptDetails] = useState(null);

    const filteredData = useMemo(() => hodSubmissionStatus.filter(item => {
        if (filter === 'All') return true;
        return item.status === filter;
    }), [filter, hodSubmissionStatus]);

    const summary = useMemo(() => ({
        total: hodSubmissionStatus.length,
        approved: hodSubmissionStatus.filter(i => i.status === 'Approved').length,
        pending: hodSubmissionStatus.filter(i => i.status === 'Pending').length
    }), [hodSubmissionStatus]);

    const handleViewDetails = useCallback((item) => {
        setSelectedDeptDetails(item);
        setShowModal(true);
    }, []);

    return (
        <div className={styles.tableCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className={styles.chartTitle} style={{ margin: 0 }}>HOD CIE Submission Monitor</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['All', 'Approved', 'Pending'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                                background: filter === f ? '#3b82f6' : '#f1f5f9', color: filter === f ? 'white' : '#64748b', transition: 'all 0.2s'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table className={styles.table} style={{ minWidth: '1000px' }}>
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>HOD Name</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Comp %</th>
                            <th>Priority</th>
                            <th>Remarks</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}>
                                    <td><Skeleton width="100px" height="14px" /></td>
                                    <td><Skeleton width="120px" height="14px" /></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <Skeleton width="80px" height="20px" style={{ borderRadius: '12px' }} />
                                            <Skeleton width="60px" height="10px" />
                                        </div>
                                    </td>
                                    <td><Skeleton width="100px" height="14px" /></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Skeleton width="50px" height="6px" />
                                            <Skeleton width="30px" height="14px" />
                                        </div>
                                    </td>
                                    <td><Skeleton width="60px" height="18px" /></td>
                                    <td><Skeleton width="150px" height="14px" /></td>
                                    <td><Skeleton width="50px" height="24px" /></td>
                                </tr>
                            ))
                        ) : filteredData.map((item) => (
                            <tr key={item.id}>
                                <td style={{ fontWeight: 600 }}>{item.dept}</td>
                                <td>{item.hod}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${item.status === 'Approved' ? styles.statusApproved : item.status === 'Submitted' ? styles.statusSubmitted : styles.statusPending}`} style={{ width: 'fit-content' }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>{item.submissionDate}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '50px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                                            <div style={{ width: `${item.completion}%`, height: '100%', background: determineColor(item.completion), borderRadius: '3px' }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem' }}>{item.completion}%</span>
                                    </div>
                                </td>
                                <td>
                                    {item.priority === 'High Priority' ? (
                                        <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fecaca' }}>
                                            High
                                        </span>
                                    ) : (
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Normal</span>
                                    )}
                                </td>
                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{item.remarks}</td>
                                <td>
                                    <button
                                        style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                        onClick={() => handleViewDetails(item)}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 600, color: '#334155' }}>Total: {summary.total}</div>
                <div style={{ fontWeight: 600, color: '#16a34a' }}>Approved: {summary.approved}</div>
                <div style={{ fontWeight: 600, color: '#f59e0b' }}>Pending: {summary.pending}</div>
            </div>

            {/* Simple Detail Modal */}
            {showModal && selectedDeptDetails && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100
                }} onClick={() => setShowModal(false)}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', minWidth: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{selectedDeptDetails.dept} Details</h3>
                        <p><strong>HOD:</strong> {selectedDeptDetails.hod}</p>
                        <p><strong>Status:</strong> {selectedDeptDetails.status}</p>
                        <p><strong>Remarks:</strong> {selectedDeptDetails.remarks}</p>
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowModal(false)} className={styles.primaryBtn}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ComplianceSection;
