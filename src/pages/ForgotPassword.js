import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { User, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import API_BASE_URL from '../config/api';

// Import background images
import bg1 from '../assets/login_background_final.png';
import bg2 from '../assets/slideshow_1.png';
import bg3 from '../assets/slideshow_2.png';
import bg4 from '../assets/slideshow_3.png';
import headerLogo from '../assets/header_logo.png';
import collegeLogo from '../assets/college1_logo.png';

const backgroundImages = [bg1, bg2, bg3, bg4];

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Username, 2: OTP, 3: New Password
    const [username, setUsername] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const navigate = useNavigate();

    // Slideshow Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/password/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(data.message);
                setStep(2);
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError("Network error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/password/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, otp })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(data.message);
                setStep(3);
            } else {
                setError(data.message || 'Invalid or expired OTP');
            }
        } catch (err) {
            setError("Network error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (newPassword.length < 4) {
            setError("Password must be at least 4 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, otp, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccessMessage(data.message);
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError("Network error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Background Slideshow */}
            <div className={styles.slideshowContainer}>
                <div className={styles.slideshow} style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                    {backgroundImages.map((bg, index) => (
                        <div key={index} className={styles.slide} style={{ backgroundImage: `url(${bg})` }} />
                    ))}
                </div>
            </div>

            <div className={styles.overlay}></div>
            <div className={styles.particlesContainer}>
                <div className={styles.particle}></div>
                <div className={styles.particle}></div>
                <div className={styles.particle}></div>
            </div>

            {/* TOP HEADER */}
            <div className={styles.topHeader}>
                <img src={collegeLogo} alt="SGP Logo" className={styles.brandLogo} />
                <h1 className={styles.collegeName}>
                    <span className={styles.whiteText}>SANJAY GANDHI POLYTECHNIC</span>
                </h1>
            </div>

            <div className={styles.contentWrapper} style={{ justifyContent: 'center' }}>
                <div className={styles.rightContent} style={{ flex: '0 0 450px' }}>
                    <div className={styles.loginCard} style={{ animation: 'none', transform: 'none' }}>

                        <div className={styles.header}>
                            <img src={headerLogo} alt="College Logo" className={styles.formLogo} style={{ maxWidth: '300px' }} />
                            <h2 className={styles.loginTitle}>Password Recovery</h2>
                            <p className={styles.subtitle}>
                                {step === 1 && "Enter your username to receive an OTP"}
                                {step === 2 && "Enter the OTP sent to your email"}
                                {step === 3 && "Create your new password"}
                            </p>
                        </div>

                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label>User ID</label>
                                    <div className={styles.inputWrapper}>
                                        <User className={styles.icon} size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter your Faculty/HOD/Principal ID"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                {error && <div className={styles.error}>{error}</div>}
                                {successMessage && <div style={{ color: '#10b981', background: '#d1fae5', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}>{successMessage}</div>}

                                <button type="submit" className={styles.loginButton} disabled={isLoading}>
                                    {isLoading ? <div className={styles.spinner}></div> : <>Send OTP <ArrowRight size={20} /></>}
                                </button>

                                <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem', width: '100%', gap: '0.5rem' }}>
                                    <ArrowLeft size={16} /> Back to Login
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label>One-Time Password (OTP)</label>
                                    <div className={styles.inputWrapper}>
                                        <Mail className={styles.icon} size={20} />
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit OTP"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            maxLength={6}
                                        />
                                    </div>
                                    <span className={styles.helperText}>Sent to registered email for <strong>{username}</strong></span>
                                </div>
                                {error && <div className={styles.error}>{error}</div>}
                                {successMessage && <div style={{ color: '#10b981', background: '#d1fae5', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem' }}>{successMessage}</div>}

                                <button type="submit" className={styles.loginButton} disabled={isLoading}>
                                    {isLoading ? <div className={styles.spinner}></div> : <>Verify OTP <ArrowRight size={20} /></>}
                                </button>

                                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginTop: '1rem' }}>
                                    Change Username
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label>New Password</label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.icon} size={20} />
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.inputGroup} style={{ marginTop: '0.5rem' }}>
                                    <label>Confirm Password</label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.icon} size={20} />
                                        <input
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                {error && <div className={styles.error}>{error}</div>}
                                {successMessage && <div style={{ color: '#10b981', background: '#d1fae5', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>{successMessage}</div>}

                                <button type="submit" className={styles.loginButton} disabled={isLoading}>
                                    {isLoading ? <div className={styles.spinner}></div> : 'Reset Password'}
                                </button>
                            </form>
                        )}

                    </div>
                </div>
            </div>

            {/* Dots */}
            <div className={styles.dotsContainer}>
                {backgroundImages.map((_, idx) => (
                    <div key={idx} className={`${styles.dot} ${currentSlide === idx ? styles.dotActive : ''}`} onClick={() => setCurrentSlide(idx)} />
                ))}
            </div>
        </div>
    );
};

export default ForgotPassword;
