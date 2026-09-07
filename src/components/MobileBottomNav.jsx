import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { House, FileText, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AzureIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.90011 21L13.7001 21L19.4001 6.79999L12.1001 6.79999L5.90011 21Z" fill="currentColor" />
        <path d="M5.90011 21L0.100098 6.79999L6.8001 6.79999L9.9001 14.2L5.90011 21Z" fill="currentColor" opacity="0.7" />
        <path d="M12.3001 20.6L19.5001 3.5L12.6001 3.5L9.9001 10L12.3001 20.6Z" fill="currentColor" opacity="0.5" />
    </svg>
);

const AwsIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="1" y="17" fontFamily="Arial Black,Arial" fontWeight="900" fontSize="11" fill="currentColor">AWS</text>
    </svg>
);

const MobileBottomNav = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isAdmin = user?.role === 'admin' || user?.role === 'owner';

    const tabs = [
        { path: '/',        icon: House,     label: 'Home',     accent: 'brand' },
    ];

    if (isAdmin || user?.canViewAzure) {
        tabs.push({ path: '/azure', icon: AzureIcon, label: 'Azure', accent: 'azure' });
    }
    if (isAdmin || user?.canViewAws) {
        tabs.push({ path: '/aws', icon: AwsIcon, label: 'AWS', accent: 'aws' });
    }

    tabs.push({ path: '/invoices', icon: FileText, label: 'Invoices', accent: 'brand' });

    if (isAdmin) {
        tabs.push({ path: '/users', icon: Users, label: 'Users', accent: 'brand' });
    }

    const accentActive = {
        azure: 'text-blue-600 dark:text-blue-400',
        aws:   'text-orange-500 dark:text-orange-400',
        brand: 'text-brand-600 dark:text-brand-400',
    };
    const accentDot = {
        azure: 'bg-blue-500',
        aws:   'bg-orange-500',
        brand: 'bg-brand-600',
    };

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 safe-area-inset-bottom">
            <div className="flex items-stretch h-16">
                {tabs.map(tab => {
                    const isActive = location.pathname === tab.path ||
                        (tab.path !== '/' && location.pathname.startsWith(tab.path));
                    const accent = tab.accent || 'brand';

                    return (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200 active:scale-95"
                        >
                            {/* Active indicator dot */}
                            {isActive && (
                                <span className={`absolute top-1.5 w-1 h-1 rounded-full ${accentDot[accent]}`} />
                            )}

                            <tab.icon
                                className={`w-5 h-5 transition-colors duration-200 ${
                                    isActive
                                        ? accentActive[accent]
                                        : 'text-gray-400 dark:text-gray-600'
                                }`}
                            />
                            <span
                                className={`text-[10px] font-bold transition-colors duration-200 ${
                                    isActive
                                        ? accentActive[accent]
                                        : 'text-gray-400 dark:text-gray-600'
                                }`}
                            >
                                {tab.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
