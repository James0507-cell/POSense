'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function SideBarContent({ isOpen, onClose }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [user, setUser] = useState({
        name: 'John Doe',
        initials: 'JD',
        role: 'Store Manager',
        email: 'john.doe@posense.com'
    });

    // Persist collapse state across navigation/refreshes
    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed');
        if (savedState !== null) {
            setIsCollapsed(JSON.parse(savedState));
        }

        if (typeof window !== 'undefined') {
            const first = localStorage.getItem('first_name') || sessionStorage.getItem('first_name') || 'John';
            const last = localStorage.getItem('last_name') || sessionStorage.getItem('last_name') || 'Doe';
            const role = localStorage.getItem('role') || sessionStorage.getItem('role') || 'Store Manager';
            const email = localStorage.getItem('email') || sessionStorage.getItem('email') || 'user@posense.com';
            
            setUser({
                name: `${first} ${last}`,
                initials: `${first[0] || ''}${last[0] || ''}`.toUpperCase(),
                role: role,
                email: email
            });
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
        if (newState) setExpandedMenus({});
    };

    const toggleMenu = (name) => {
        if (isCollapsed) setIsCollapsed(false);
        setExpandedMenus(prev => ({
            ...prev,
            [name]: !prev[name]
        }));
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Products', path: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { name: 'Inventory', path: '/inventory', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { name: 'Inventory List', path: '/inventory-list', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h.01M9 16h.01M7 10h10M7 14h10' },
        { name: 'Sales', path: '/sales', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Sales Records', path: '/sales-records', icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
        { 
            name: 'Sales Entry', 
            icon: 'M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            subItems: [
                { name: 'Standard Form', path: '/sales?tab=standard' },
                { name: 'Kiosk Form', path: '/sales?tab=kiosk' },
            ]
        },
        { name: 'Expenses', path: '/expenses', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Net Balance', path: '/net-balance', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { name: 'Audit Logs', path: '/audit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Employees', path: '/employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    ];

    const rolePermissions = {
        'Admin': ['Dashboard', 'Products', 'Inventory', 'Inventory List', 'Sales', 'Sales Records', 'Sales Entry', 'Expenses', 'Net Balance', 'Audit Logs', 'Employees'],
        'Store Manager': ['Dashboard', 'Products', 'Inventory', 'Sales', 'Sales Entry', 'Expenses', 'Net Balance', 'Audit Logs'],
        'Products and Inventory Manager': ['Products', 'Inventory'],
        'Sales & Expense Analyst': ['Sales', 'Sales Entry', 'Expenses', 'Net Balance'],
        'Cashier': ['Sales Records', 'Sales Entry'],
        'Inventory Clerk': ['Inventory List']
    };

    const allowedMenuItems = menuItems.filter(item => {
        const permissions = rolePermissions[user.role] || [];
        return permissions.includes(item.name);
    });

    const handleLogout = () => {
        ['employee_id', 'first_name', 'last_name', 'email', 'role'].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
        router.push('/');
    };

    const handleNavigation = (path) => {
        router.push(path);
        if (onClose) onClose();
    };

    const isSubItemActive = (subPath) => {
        const [path, query] = subPath.split('?');
        if (pathname !== path) return false;
        if (!query) return true;
        
        const params = new URLSearchParams(query);
        for (const [key, value] of params.entries()) {
            if (searchParams.get(key) !== value) return false;
        }
        return true;
    };

    const isItemActive = (item) => {
        if (item.path) return pathname === item.path;
        if (item.subItems) {
            return item.subItems.some(sub => isSubItemActive(sub.path));
        }
        return false;
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
                fixed md:relative inset-y-0 left-0 z-50
                ${isCollapsed ? 'w-24' : 'w-72'} 
                h-screen flex flex-col bg-white border-r border-gray-200 shadow-xl md:shadow-sm 
                font-[family-name:var(--font-inter)] transition-all duration-300
            `}>
                {/* Close Button Mobile */}
                <button 
                    onClick={onClose}
                    className="md:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Collapse Toggle Button Desktop */}
                <button 
                    onClick={toggleCollapse}
                    className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-gray-400 hover:text-blue-700 hover:border-blue-700 transition-all z-20 shadow-sm"
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
                <div className="flex-1 overflow-y-auto py-6 px-4 scrollbar-thin">
                    <nav className="space-y-1">
                        {allowedMenuItems.map((item) => (
                            <div key={item.name} className="space-y-1">
                                <button
                                    onClick={() => item.subItems ? toggleMenu(item.name) : handleNavigation(item.path)}
                                    title={isCollapsed ? item.name : ''}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                                        isItemActive(item)
                                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                                >
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                    </svg>
                                    {!isCollapsed && (
                                        <>
                                            <span className="whitespace-nowrap overflow-hidden flex-1 text-left">{item.name}</span>
                                            {item.subItems && (
                                                <svg className={`w-4 h-4 transition-transform duration-200 ${expandedMenus[item.name] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </>
                                    )}
                                </button>
                                
                                {!isCollapsed && item.subItems && (expandedMenus[item.name] || isItemActive(item)) && (
                                    <div className="ml-9 space-y-1 border-l-2 border-gray-50 pl-2 py-1">
                                        {item.subItems.map((sub) => (
                                            <button
                                                key={sub.name}
                                                onClick={() => handleNavigation(sub.path)}
                                                className={`w-full flex items-center px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                                                    isSubItemActive(sub.path)
                                                    ? 'text-blue-700 bg-blue-50/50'
                                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Row 3: User Card and Logout Button */}
                <div className={`p-6 mt-auto bg-gray-50/50 border-t border-gray-100 ${isCollapsed ? 'px-2 flex flex-col items-center' : ''}`}>
                    {!isCollapsed ? (
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 transition-transform hover:scale-[1.02] cursor-pointer group w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-200 transition-colors shrink-0">
                                    {user.initials}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 font-medium truncate">{user.role}</p>
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mb-4 shrink-0 shadow-sm border border-gray-100 cursor-pointer">
                            {user.initials}
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
        </>
    );
}

export default function SideBar({ isOpen, onClose }) {
    return (
        <Suspense fallback={<div className="w-24 h-screen bg-white border-r border-gray-200" />}>
            <SideBarContent isOpen={isOpen} onClose={onClose} />
        </Suspense>
    );
}
