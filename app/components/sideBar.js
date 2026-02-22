'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function SideBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Persist collapse state across navigation/refreshes
    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
            setIsCollapsed(JSON.parse(savedState));
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Products', path: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { name: 'Inventory', path: '/inventory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { name: 'Sales', path: '/sales', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Expenses', path: '/expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Net Balance', path: '/net-balance', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    ];

    const handleLogout = () => {
        router.push('/');
    };

    const handleNavigation = (path) => {
        router.push(path);
    };

    return (
        <div className={`${isCollapsed ? 'w-24' : 'w-72'} h-screen flex flex-col bg-white border-r border-gray-200 shadow-sm font-[family-name:var(--font-inter)] transition-all duration-300 relative`}>
            {/* Collapse Toggle Button */}
            <button 
                onClick={toggleCollapse}
                className="absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-700 hover:border-blue-700 transition-all z-20 shadow-sm"
            >
                <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Row 1: App Name and Description */}
            <div className={`p-8 border-b border-gray-50 ${isCollapsed ? 'flex justify-center px-0' : ''}`}>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center shadow-md shrink-0">
                        <span className="text-white font-bold text-xl">P</span>
                    </div>
                    {!isCollapsed && (
                        <h1 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-blue-900 tracking-tight whitespace-nowrap overflow-hidden">
                            POSense
                        </h1>
                    )}
                </div>
                {!isCollapsed && (
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest leading-tight">
                        AI-Powered Intelligence for Modern Business
                    </p>
                )}
            </div>

            {/* Row 2: Functionality Buttons */}
            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => handleNavigation(item.path)}
                            title={isCollapsed ? item.name : ''}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                                pathname === item.path 
                                ? 'bg-blue-50 text-blue-700 shadow-sm' 
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            } ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                            </svg>
                            {!isCollapsed && (
                                <span className="whitespace-nowrap overflow-hidden">{item.name}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Row 3: User Card and Logout Button */}
            <div className={`p-6 mt-auto bg-gray-50/50 border-t border-gray-100 ${isCollapsed ? 'px-2 flex flex-col items-center' : ''}`}>
                {!isCollapsed ? (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 transition-transform hover:scale-[1.02] cursor-pointer group w-full">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-200 transition-colors shrink-0">
                                JD
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 truncate">John Doe</p>
                                <p className="text-xs text-gray-500 font-medium truncate">Store Manager</p>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">john.doe@posense.com</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-4 shrink-0 shadow-sm border border-gray-100 cursor-pointer">
                        JD
                    </div>
                )}
                
                <button 
                    onClick={handleLogout}
                    title={isCollapsed ? 'Logout' : ''}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors active:scale-[0.98] transform ${isCollapsed ? 'px-0' : ''}`}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    );
}
