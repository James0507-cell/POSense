'use client';

import React from 'react';

export default function AIAnalysis({ chatHistory, chatMessage, setChatMessage, handleSendMessage }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-[600px] flex flex-col overflow-hidden">
      <div className="p-8 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">AI Inventory Analyst</h4>
            <p className="text-sm text-gray-500 font-medium">Ask anything about your products and stock</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
              msg.role === 'user' 
              ? 'bg-blue-700 text-white rounded-tr-none' 
              : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 border-t border-gray-100 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your question here... (e.g., Which products are low on stock?)"
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
          />
          <button 
            type="submit"
            className="bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all active:scale-[0.98] shadow-lg shadow-blue-100"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
