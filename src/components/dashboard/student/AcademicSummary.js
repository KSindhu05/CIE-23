import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, AlertCircle, CheckCircle, User } from 'lucide-react';
import styles from '../../../pages/StudentDashboard.module.css';
import Skeleton from '../../ui/Skeleton';

const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    }),
};

const AcademicSummary = ({ studentInfo, riskLevel, cieStatus = '0/5', loading = false, t }) => {
    const riskColor = riskLevel === 'High' ? 'var(--danger)' : riskLevel === 'Moderate' ? 'var(--warning)' : 'var(--success)';
    const riskLabel = riskLevel || 'Low';
    const isHighRisk = riskLevel === 'High';

    const cards = [
        {
            icon: <BookOpen size={22} />,
            iconBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(251, 191, 36, 0.08) 100%)',
            iconColor: 'var(--warning)',
            label: t('avgCieScoreLabel'),
            value: studentInfo.avgCieScore || '0/50',
            subtext: t('currentSem'),
        },
        {
            icon: <CheckCircle size={22} />,
            iconBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(52, 211, 153, 0.08) 100%)',
            iconColor: 'var(--success)',
            label: t('cieProgressLabel'),
            value: cieStatus,
            subtext: t('ciesCompleted'),
        },
        {
            icon: <User size={22} />,
            iconBg: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
            iconColor: '#6366f1',
            label: t('assignedMentorLabel'),
            value: studentInfo.mentor || t('notAssigned'),
            subtext: t('academicGuide'),
        },
    ];

    return (
        <div className={styles.summaryGrid}>
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    className={styles.summaryCard}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    whileHover={{ y: -4, transition: { duration: 0.25 } }}
                >
                    <div
                        className={styles.summaryIcon}
                        style={{ background: card.iconBg, color: card.iconColor }}
                    >
                        {card.icon}
                    </div>
                    <div className={styles.summaryInfo}>
                        <span className={styles.summaryLabel}>{card.label}</span>
                        {loading ? (
                            <Skeleton width="80px" height="28px" style={{ margin: '4px 0' }} />
                        ) : (
                            <h3 className={styles.summaryValue}>{card.value}</h3>
                        )}
                        <span className={styles.summarySubtext}>{card.subtext}</span>
                    </div>
                </motion.div>
            ))}

            {/* Risk Level Card */}
            <motion.div
                className={styles.summaryCard}
                custom={3}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                style={{
                    borderLeft: `4px solid ${riskColor}`,
                    ...(isHighRisk ? { animation: 'pulseGlow 2s ease-in-out infinite' } : {}),
                }}
            >
                <motion.div
                    className={styles.summaryIcon}
                    style={{ background: `${riskColor}15`, color: riskColor }}
                    animate={isHighRisk ? { scale: [1, 1.1, 1] } : {}}
                    transition={isHighRisk ? { repeat: Infinity, duration: 2, ease: 'easeInOut' } : {}}
                >
                    <AlertCircle size={22} />
                </motion.div>
                <div className={styles.summaryInfo}>
                    <span className={styles.summaryLabel}>{t('academicStatus')}</span>
                    {loading ? (
                        <Skeleton width="100px" height="28px" style={{ margin: '4px 0' }} />
                    ) : (
                        <h3 className={styles.summaryValue} style={{ color: riskColor }}>{t(riskLabel.toLowerCase())} {t('riskLevel')}</h3>
                    )}
                    <span className={styles.summarySubtext}>{t('basedOnMarks')}</span>
                </div>
            </motion.div>
        </div>
    );
};

export default AcademicSummary;
