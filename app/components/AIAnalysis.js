'use client';

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function AIAnalysis({ chatHistory, chatMessage, setChatMessage, handleSendMessage, isAiThinking, title = "AI Business Analyst", description = "Ask anything about your business data" }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const chatContainerRef = useRef(null);

  const handleCopy = (e, index) => {
    // Get the rendered text from the message bubble's prose container
    const messageElement = e.currentTarget.closest('.group').querySelector('.prose');
    const textToCopy = messageElement ? messageElement.innerText : chatHistory[index].content;
    
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-[600px] flex flex-col overflow-hidden relative">
      <div className="p-8 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">{title}</h4>
            <p className="text-sm text-gray-500 font-medium">{description}</p>
          </div>
        </div>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm relative group ${
              msg.role === 'user' 
              ? 'bg-blue-700 text-white rounded-tr-none' 
              : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
            }`}>
              {/* Copy Button */}
              <button 
                onClick={(e) => handleCopy(e, i)}
                className={`absolute top-2 ${msg.role === 'user' ? '-left-10' : '-right-10'} opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-gray-100 text-gray-400`}
                title="Copy message"
              >
                {copiedIndex === i ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m3 3h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2z" />
                  </svg>
                )}
              </button>

              <div className="prose prose-sm max-w-none prose-slate">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-md font-bold mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                    code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs font-mono">{children}</code>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm font-medium shadow-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-gray-100 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your question here..."
            disabled={isAiThinking}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={isAiThinking || !chatMessage.trim()}
            className="bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-all active:scale-[0.98] shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {isAiThinking ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
