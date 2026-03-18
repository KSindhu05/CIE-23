import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import styles from './DashboardLayout.module.css';
import NotificationPanel from './NotificationPanel';
import { Bell } from 'lucide-react';

const DashboardLayout = ({ menuItems, children, rightSidebar }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 768px)');
        const handler = (e) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    return (
        <div className={styles.layout}>
            <Sidebar menuItems={menuItems} />
            <main className={styles.mainContent} style={{ marginRight: (!isMobile && rightSidebar) ? '300px' : '0', transition: 'margin-right 0.3s' }}>
                {children}

                {/* Floating Notification Bell - Hide if right sidebar is used? Or keep as backup? */}
                {/* For now keeping it, but maybe hidden if right sidebar deals with notifs */}
                {!rightSidebar && (
                    <div className={styles.floatingControls}>


                        <button
                            className={styles.notificationBtn}
                            onClick={() => setShowNotifications(!showNotifications)}
                            title="Notifications"
                        >
                            <Bell size={24} />
                        </button>
                    </div>
                )}

                {showNotifications && !rightSidebar && (
                    <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
            </main>
            {rightSidebar}
        </div>
    );
};

export default DashboardLayout;
