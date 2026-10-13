import React from 'react';
import { Menu, Bot, Server, Database, Sparkles, ChevronRight } from 'lucide-react';

export default function Navbar({ setMobileOpen, activeTab, selectedSymbol, setSelectedSymbol, onOpenChat, backendStatus }) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'dashboard': return 'Quantitative Terminal Dashboard';
      case 'builder': return 'Visual No-Code Strategy Builder';
      case 'backtests': return 'Historical Backtesting Simulator';
      case 'ml-predictions': return 'Machine Learning Predictive Engine';
      case 'comparison': return 'Multi-Strategy Performance Comparison';
      case 'ai-analyst': return 'TradeSimX AI Quantitative Analyst';
      case 'reports': return 'Report Export Hub';
      case 'settings': return 'Platform Settings';
      default: return 'TradeSimX AI';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#070B14]/80 backdrop-blur-md border-b border-[#1F2937] px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#94A3B8] hover:text-white bg-[#111827] border border-[#1F2937] rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-xs text-[#94A3B8]">
            <span>Platform</span>
            <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
            <span className="text-indigo-400 capitalize">{activeTab.replace('-', ' ')}</span>
          </div>
          <h1 className="text-base lg:text-lg font-bold text-white tracking-tight">
            {getTabTitle(activeTab)}
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Symbol Quick Picker */}
        <div className="hidden sm:flex items-center bg-[#111827] border border-[#1F2937] rounded-lg px-2.5 py-1.5 space-x-2">
          <span className="text-xs text-[#94A3B8] font-medium">Symbol:</span>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="BTC-USD" className="bg-[#111827]">BTC-USD (Bitcoin)</option>
            <option value="ETH-USD" className="bg-[#111827]">ETH-USD (Ethereum)</option>
            <option value="SOL-USD" className="bg-[#111827]">SOL-USD (Solana)</option>
            <option value="BNB-USD" className="bg-[#111827]">BNB-USD (Binance)</option>
          </select>
        </div>

        {/* Backend & DB Status Pills */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            <Server className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">API Live</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
            <Database className="w-3.5 h-3.5" />
            <span className="font-medium text-[11px]">{backendStatus?.database_type || 'MongoDB'}</span>
          </div>
        </div>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenChat}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all transform hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    </header>
  );
}
