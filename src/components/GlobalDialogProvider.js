import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AlertTriangle, HelpCircle, ShieldAlert, MessageSquare } from 'lucide-react';
import styles from './GlobalDialogProvider.module.css';

// ========== Context ==========
const DialogContext = createContext(null);

export const useDialog = () => {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error('useDialog must be used within <DialogProvider>');
    return ctx;
};

// ========== Icons by variant ==========
const VARIANT_ICONS = {
    info: <HelpCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    danger: <ShieldAlert size={20} />,
    prompt: <MessageSquare size={20} />,
};

// ========== ConfirmDialog Component ==========
const ConfirmDialog = ({ config, onResolve }) => {
    const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'info' } = config;

    const confirmRef = useRef(null);

    useEffect(() => {
        confirmRef.current?.focus();
    }, []);

    // Handle Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onResolve(false); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onResolve]);

    const btnClass = variant === 'danger' ? styles.btnDanger
        : variant === 'warning' ? styles.btnWarning
            : styles.btnConfirm;

    return (
        <div className={styles.overlay} onClick={() => onResolve(false)}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={`${styles.iconWrapper} ${styles[variant]}`}>
                        {VARIANT_ICONS[variant]}
                    </div>
                    <h3 className={styles.title}>{title || 'Confirm Action'}</h3>
                </div>
                <div className={styles.body}>
                    <p className={styles.message}>{message}</p>
                </div>
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={() => onResolve(false)}>
                        {cancelText}
                    </button>
                    <button ref={confirmRef} className={`${styles.btn} ${btnClass}`} onClick={() => onResolve(true)}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ========== PromptDialog Component ==========
const PromptDialog = ({ config, onResolve }) => {
    const { title, message, defaultValue = '', placeholder = '', inputLabel, confirmText = 'Submit', cancelText = 'Cancel', multiline = false } = config;
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef(null);

    useEffect(() => {
        // Focus and select existing text
        if (inputRef.current) {
            inputRef.current.focus();
            if (defaultValue) inputRef.current.select();
        }
    }, [defaultValue]);

    // Handle Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onResolve(null); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onResolve]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onResolve(value);
    };

    const handleKeyDown = (e) => {
        if (!multiline && e.key === 'Enter') {
            e.preventDefault();
            onResolve(value);
        }
    };

    return (
        <div className={styles.overlay} onClick={() => onResolve(null)}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={`${styles.iconWrapper} ${styles.prompt}`}>
                        {VARIANT_ICONS.prompt}
                    </div>
                    <h3 className={styles.title}>{title || 'Input Required'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.body}>
                        {message && <p className={styles.message}>{message}</p>}
                        <div className={styles.inputWrapper}>
                            {inputLabel && <label className={styles.inputLabel}>{inputLabel}</label>}
                            {multiline ? (
                                <textarea
                                    ref={inputRef}
                                    className={styles.textarea}
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={placeholder}
                                    rows={3}
                                />
                            ) : (
                                <input
                                    ref={inputRef}
                                    className={styles.input}
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholder}
                                />
                            )}
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <button type="button" className={`${styles.btn} ${styles.btnCancel}`} onClick={() => onResolve(null)}>
                            {cancelText}
                        </button>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrompt}`}>
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ========== Provider ==========
export const DialogProvider = ({ children }) => {
    const [dialog, setDialog] = useState(null); // { type: 'confirm'|'prompt', config, resolve }

    const showConfirm = useCallback((options) => {
        return new Promise((resolve) => {
            setDialog({ type: 'confirm', config: options, resolve });
        });
    }, []);

    const showPrompt = useCallback((options) => {
        return new Promise((resolve) => {
            setDialog({ type: 'prompt', config: options, resolve });
        });
    }, []);

    const handleResolve = useCallback((result) => {
        if (dialog?.resolve) dialog.resolve(result);
        setDialog(null);
    }, [dialog]);

    return (
        <DialogContext.Provider value={{ showConfirm, showPrompt }}>
            {children}
            {dialog?.type === 'confirm' && (
                <ConfirmDialog config={dialog.config} onResolve={handleResolve} />
            )}
            {dialog?.type === 'prompt' && (
                <PromptDialog config={dialog.config} onResolve={handleResolve} />
            )}
        </DialogContext.Provider>
    );
};

export default DialogProvider;
