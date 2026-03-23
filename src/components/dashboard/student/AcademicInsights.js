import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from '../../../pages/StudentDashboard.module.css';
import Skeleton from '../../ui/Skeleton';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

const AcademicInsights = ({ realMarks, loading = false }) => {
    if (!loading && (!realMarks || realMarks.length === 0)) return null;

    // Find latest CIE with data
    const cieKeys = ['cie5Score', 'cie4Score', 'cie3Score', 'cie2Score', 'cie1Score'];
    let latestCieKey = 'cie1Score';
    for (const key of cieKeys) {
        if (realMarks.some(m => m[key] != null)) { latestCieKey = key; break; }
    }

    // Get marks with latest CIE score
    const marksWithScore = realMarks.filter(m => m[latestCieKey] != null).map(m => ({ ...m, latestScore: m[latestCieKey] }));
    if (marksWithScore.length === 0) return null;

    const bestSubject = [...marksWithScore].sort((a, b) => b.latestScore - a.latestScore)[0];
    const worstSubject = [...marksWithScore].sort((a, b) => a.latestScore - b.latestScore)[0];

    return (
        <motion.div
            className={styles.insightsCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className={styles.insightsHeader}>
                <motion.div
                    className={styles.insightIconBox}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                    <Lightbulb size={20} color="#F59E0B" />
                </motion.div>
                <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>System Academic Analysis</h3>
            </div>

            <motion.div
                className={styles.insightsList}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className={styles.insightItem}>
                            <div className={styles.insightIndicator} style={{ background: '#e2e8f0' }}></div>
                            <div className={styles.insightContent}>
                                <Skeleton width="100px" height="16px" style={{ marginBottom: '0.5rem' }} />
                                <Skeleton width="200px" height="14px" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        {/* Strength */}
                        <motion.div
                            className={styles.insightItem}
                            variants={itemVariants}
                            whileHover={{ x: 6, transition: { duration: 0.2 } }}
                        >
                            <div className={styles.insightIndicator} style={{ background: 'var(--success)' }}></div>
                            <div className={styles.insightContent}>
                                <h4>Strongest Subject</h4>
                                <p>You are excelling in <strong>{bestSubject?.name}</strong> with a score of {bestSubject?.latestScore}/50.</p>
                            </div>
                            <ArrowUpRight size={18} color="var(--success)" />
                        </motion.div>

                        {/* Weakness */}
                        {worstSubject && worstSubject.latestScore < 35 && (
                            <motion.div
                                className={styles.insightItem}
                                variants={itemVariants}
                                whileHover={{ x: 6, transition: { duration: 0.2 } }}
                            >
                                <div className={styles.insightIndicator} style={{ background: 'var(--danger)' }}></div>
                                <div className={styles.insightContent}>
                                    <h4>Focus Area</h4>
                                    <p>Consider reviewing <strong>{worstSubject?.name}</strong> to improve your score ({worstSubject?.latestScore}/50).</p>
                                </div>
                                <ArrowDownRight size={18} color="var(--danger)" />
                            </motion.div>
                        )}
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default AcademicInsights;
