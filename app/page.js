'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const LoginPage = () => {
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        router.push('/dashboard');
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-[family-name:var(--font-inter)]">
            {/* Left side - Branding & Description with Dynamic Background */}
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 relative overflow-hidden bg-blue-900 text-white p-16">
                {/* Background Design Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-700/20 via-transparent to-transparent"></div>
                </div>

                <div className="max-w-xl z-10 text-center lg:text-left">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-blue-900 font-bold text-2xl">P</span>
                        </div>
                        <h1 className="text-5xl font-[family-name:var(--font-outfit)] font-extrabold tracking-tight">
                            POSense
                        </h1>
                    </div>
                    
                    <h2 className="text-4xl font-[family-name:var(--font-outfit)] font-bold mb-6 leading-tight">
                        AI-Powered Intelligence <br/>
                        <span className="text-blue-300">for Modern Business</span>
                    </h2>
                    
                    <p className="text-xl font-light leading-relaxed text-blue-100 opacity-90 max-w-md">
                        Transform your checkout into a data powerhouse. Our AI analyzes every transaction to reveal insights that grow your profit.
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-8 border-t border-blue-800/50 pt-10">
                        <div>
                            <p className="text-3xl font-bold">24/7</p>
                            <p className="text-sm text-blue-300 uppercase tracking-widest mt-1">AI Monitoring</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">15%</p>
                            <p className="text-sm text-blue-300 uppercase tracking-widest mt-1">Avg. Growth</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Login Form with subtle patterns */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-8 sm:p-16 bg-white relative">
                {/* Subtle background decoration for right side */}
                <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] pointer-events-none z-0">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                <div className="w-full max-w-md z-10">
                    <div className="lg:hidden mb-12 flex flex-col items-center">
                        <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-white font-bold">P</span>
                        </div>
                        <h1 className="text-3xl font-[family-name:var(--font-outfit)] font-extrabold text-blue-900">POSense</h1>
                    </div>
                    
                    <div className="mb-10">
                        <h2 className="text-3xl font-[family-name:var(--font-outfit)] font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-500 font-medium">Log in to access your AI business dashboard</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="manager@yourstore.com"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700 uppercase tracking-wide" htmlFor="password">
                                    Password
                                </label>
                                <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                    Forgot password?
                                </a>
                            </div>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                required
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="remember" className="ml-3 text-sm text-gray-600 font-medium cursor-pointer">
                                Keep this session active
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98] transform flex items-center justify-center gap-2"
                        >
                            <span>Enter Dashboard</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </form>

                    <div className="mt-12 text-center pt-8 border-t border-gray-100">
                        <p className="text-gray-500 font-medium">
                            Don&apos;t have an account yet?{' '}
                            <a href="#" className="text-blue-700 font-bold hover:text-blue-900 transition-colors underline underline-offset-4">
                                Join POSense
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
