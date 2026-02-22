'use client';

import React, { useState, useEffect } from 'react';
import SideBar from '../components/sideBar.js';
import ExpensesList from './components/ExpensesList';
import ExpensesAnalytics from './components/ExpensesAnalytics';
import AIAnalysis from '../components/AIAnalysis';
import ExpenseForm from './components/ExpenseForm';

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI expense analyst. How can I help you analyze your spending today?' }
  ]);

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [userName, setUserName] = useState('Manager');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/expense-categories')
      ]);

      if (expRes.ok && catRes.ok) {
        const expData = await expRes.json();
        const catData = await catRes.json();
        setExpenses(expData);
        setCategories(catData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const first = sessionStorage.getItem('first_name') || '';
      const last = sessionStorage.getItem('last_name') || '';
      if (first || last) setUserName(`${first} ${last}`);
    }
    fetchData();
  }, []);

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        const response = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchData();
        } else {
          alert("Failed to delete expense");
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isAiThinking) return;

    const userMsg = chatMessage;
    const newUserMessage = { role: 'user', content: userMsg };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatMessage('');
    setIsAiThinking(true);

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: {
              expenses: expenses,
              categories: categories,
              summary: {
                  total_expenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
                  count: expenses.length,
                  category_breakdown: categories.map(c => ({
                      name: c.category_name,
                      total: expenses.filter(e => e.category_id === c.category_id).reduce((sum, e) => sum + Number(e.amount), 0)
                  }))
              }
          },
          history: chatHistory.slice(-10)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I'm having trouble analyzing your expenses right now. Please try again." 
        }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            Expenses Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Manager View</p>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8 animate-fade-in">
          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
            {[
              { id: 'list', label: 'Expenses List', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'ai', label: 'AI Analysis', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                <span className="ml-4 text-gray-500 font-medium">Loading expenses data...</span>
              </div>
            ) : (
              <>
                {activeTab === 'list' && (
                  <ExpensesList 
                    expenses={expenses} 
                    categories={categories}
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onAdd={handleAddNew}
                  />
                )}
                {activeTab === 'analytics' && (
                  <ExpensesAnalytics 
                    expenses={expenses} 
                  />
                )}
                {activeTab === 'ai' && (
                  <AIAnalysis 
                    chatHistory={chatHistory} 
                    chatMessage={chatMessage} 
                    setChatMessage={setChatMessage} 
                    handleSendMessage={handleSendMessage} 
                    isAiThinking={isAiThinking}
                    title="AI Expense Analyst"
                    description="Ask anything about your business expenses and spending patterns"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Expense Form Modal */}
      {isFormOpen && (
        <ExpenseForm 
          expense={editingExpense} 
          categories={categories}
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchData} 
        />
      )}
    </div>
  );
}
