import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { Bot, Send, Sparkles, User, RefreshCw, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { PLATFORM_CONFIG } from '../../config/platformConfig';

export default function AIChatbot({ activeContext = {}, isFloating = false, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello! I am your **${PLATFORM_CONFIG.brandName} AI Conversational Assistant**.\n\nAsk me anything — from casual conversation ("Hi", "How are you?"), Python coding, and ML models to strategy critique and backtest analysis!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiHealth, setAiHealth] = useState({ configured: false, reason: 'Checking configuration...' });
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Hi! How are you?",
    "What can you do?",
    "What is Python?",
    "Explain RSI & MACD",
    "Analyze my backtest",
    "What is machine learning?",
    "Challenge my strategy"
  ];

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await api.checkAIHealth();
      setAiHealth(res);
    } catch (err) {
      setAiHealth({ configured: false, reason: 'Could not connect to backend server' });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    setLastFailedMessage(null);

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const conversationMemory = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.chatAI(
        text,
        conversationMemory,
        activeContext.strategy || null,
        activeContext.backtest || null,
        activeContext.prediction || null,
        activeContext.regime || null,
        activeContext.portfolio || null,
        activeContext.risk || null
      );

      if (res.success) {
        const aiMsg = {
          id: Date.now() + 1,
          sender: 'ai',
          text: res.message || "AI service responded with an empty message.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(res.error || 'AI request failed.');
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      setLastFailedMessage(text);

      let errMessage = "AI request failed. Please try again.";
      if (err?.response?.status === 401) {
        errMessage = "Please log in to use the AI Assistant.";
      } else if (err?.response?.data?.error) {
        errMessage = `AI Error: ${err.response.data.error}`;
      } else if (err?.message) {
        errMessage = err.message;
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        isError: true,
        text: errMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSend(lastFailedMessage);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-2xl ${
      isFloating ? 'w-full max-w-lg h-[620px]' : 'h-[calc(100vh-140px)] min-h-[550px]'
    }`}>
      {/* Header */}
      <div className="p-4 bg-[#0B1120] border-b border-[#1F2937] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">{PLATFORM_CONFIG.brandName} AI Assistant</span>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${
                aiHealth.configured
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {aiHealth.configured ? `ONLINE (${aiHealth.model || 'Groq LLM'})` : 'API KEY NOT SET'}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8]">Natural Conversational Assistant for TradeSimX</p>
          </div>
        </div>

        {isFloating && (
          <button onClick={onClose} className="p-1 text-[#94A3B8] hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* API Key Not Configured Notice */}
      {!aiHealth.configured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 px-4 flex items-center justify-between text-amber-400 text-xs font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{aiHealth.reason || 'GROQ_API_KEY is missing in backend/.env'}</span>
          </div>
          <button onClick={checkHealth} className="p-1 hover:bg-amber-500/20 rounded">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                isUser
                  ? 'bg-indigo-600 text-white'
                  : msg.isError
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                isUser
                  ? 'bg-[#6366F1] text-white rounded-tr-none shadow-md shadow-indigo-500/20 font-medium'
                  : msg.isError
                  ? 'bg-red-500/10 text-red-300 border border-red-500/30 rounded-tl-none'
                  : 'bg-[#070B14] text-[#F8FAFC] border border-[#1F2937] rounded-tl-none'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.isError && lastFailedMessage && (
                  <button
                    onClick={handleRetry}
                    className="mt-2.5 inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-[11px] border border-red-500/40 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-once" />
                    <span>Retry Request</span>
                  </button>
                )}

                <span className={`block text-[9px] mt-1.5 ${isUser ? 'text-indigo-200 text-right' : 'text-[#94A3B8]'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#070B14] border border-[#1F2937] rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce delay-150"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-300"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="p-3 border-t border-[#1F2937] bg-[#070B14]/40 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-[#1F2937] hover:bg-indigo-500/20 hover:border-indigo-500/40 text-[11px] text-[#94A3B8] hover:text-white border border-[#374151] whitespace-nowrap transition-colors flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3.5 bg-[#0B1120] border-t border-[#1F2937]">
        <div className="flex items-center space-x-2 bg-[#070B14] border border-[#1F2937] focus-within:border-indigo-500 rounded-xl px-3 py-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows="1"
            placeholder="Type any message or question..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#94A3B8] focus:outline-none resize-none max-h-24"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 rounded-lg bg-[#6366F1] hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
