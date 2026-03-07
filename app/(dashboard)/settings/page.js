'use client';

import React, { useState, useEffect } from 'react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('brands');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});

    const configs = {
        brands: {
            title: 'Brands',
            endpoint: '/api/brands',
            idField: 'brand_id',
            nameField: 'name',
            fields: [
                { name: 'name', label: 'Brand Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ],
            displayFields: [
                { name: 'brand_id', label: 'ID' },
                { name: 'name', label: 'Name' },
                { name: 'description', label: 'Description' },
                { name: 'status', label: 'Status', type: 'badge' },
                { name: 'created_at', label: 'Created At', type: 'date' }
            ]
        },
        categories: {
            title: 'Expense Categories',
            endpoint: '/api/expense-categories',
            idField: 'category_id',
            nameField: 'category_name',
            fields: [
                { name: 'category_name', label: 'Category Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ],
            displayFields: [
                { name: 'category_id', label: 'ID' },
                { name: 'category_name', label: 'Name' },
                { name: 'description', label: 'Description' },
                { name: 'status', label: 'Status', type: 'badge' },
                { name: 'created_at', label: 'Created At', type: 'date' }
            ]
        },
        payment: {
            title: 'Payment Types',
            endpoint: '/api/payment-types',
            idField: 'payment_type_id',
            nameField: 'payment_name',
            fields: [
                { name: 'payment_name', label: 'Payment Name', type: 'text', required: true },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
            ],
            displayFields: [
                { name: 'payment_type_id', label: 'ID' },
                { name: 'payment_name', label: 'Payment Name' },
                { name: 'description', label: 'Description' },
                { name: 'status', label: 'Status', type: 'badge' }
            ]
        }
    };

    const currentConfig = configs[activeTab];

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(currentConfig.endpoint);
            const result = await res.json();
            if (res.ok && Array.isArray(result)) {
                setData(result);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData(item);
        } else {
            const initialForm = { status: 'Active' };
            currentConfig.fields.forEach(f => {
                if (f.name !== 'status') initialForm[f.name] = '';
            });
            setFormData(initialForm);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const method = editingItem ? 'PUT' : 'POST';
        const employeeId = localStorage.getItem('employee_id') || sessionStorage.getItem('employee_id');
        
        const payload = { 
            ...formData, 
            [editingItem ? 'updated_by' : 'created_by']: employeeId 
        };

        try {
            const res = await fetch(currentConfig.endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const formatValue = (item, field) => {
        const val = item[field.name];
        if (field.type === 'date' && val) return new Date(val).toLocaleString();
        if (field.type === 'badge' && val) {
            return (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    val === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {val}
                </span>
            );
        }
        return val || '-';
    };

    return (
        <div className="p-4 md:p-10 space-y-6 md:space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">System Configuration</h1>
                    <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Manage lookup tables and system metadata</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 whitespace-nowrap"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Add New
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 md:gap-2 p-1 bg-gray-100 rounded-2xl w-fit max-w-full overflow-x-auto">
                {Object.entries(configs).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {config.title}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50">
                            <tr>
                                {currentConfig.displayFields.map(f => (
                                    <th key={f.name} className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{f.label}</th>
                                ))}
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={currentConfig.displayFields.length + 1} className="px-6 py-10 text-center text-gray-500 font-medium">Loading...</td>
                                </tr>
                            ) : !Array.isArray(data) || data.length === 0 ? (
                                <tr>
                                    <td colSpan={currentConfig.displayFields.length + 1} className="px-6 py-10 text-center text-gray-500 font-medium">No records found.</td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item[currentConfig.idField]} className="hover:bg-gray-50/80 transition-colors">
                                        {currentConfig.displayFields.map(f => (
                                            <td key={f.name} className={`px-6 py-4 text-sm ${f.name === currentConfig.nameField ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                                {formatValue(item, f)}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">{editingItem ? 'Edit' : 'Add'} {currentConfig.title}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {currentConfig.fields.map(field => (
                                <div key={field.name} className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">{field.label}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            required={field.required}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all resize-none"
                                            rows="3"
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            required={field.required}
                                            value={formData[field.name] || 'Active'}
                                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                                        >
                                            {field.options.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            value={formData[field.name] || ''}
                                            onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-100">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
