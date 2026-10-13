import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, LogOut, ShieldCheck, Briefcase, Workflow, CheckCircle2 } from 'lucide-react';
import { PLATFORM_CONFIG } from '../config/platformConfig';

export default function ProfilePage({ user, onLogout }) {
  const [paperAcc, setPaperAcc] = useState(null);

  useEffect(() => {
    api.getPaperSummary().then(res => {
      if (res.success) setPaperAcc(res.account);
    }).catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">User Account Profile</h1>
        <p className="text-xs text-[#94A3B8] mt-1">Manage user preferences, virtual trading profile, and session tokens.</p>
      </div>

      {/* User Info Card */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'TR'}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white">{user?.name || 'Trader Account'}</h2>
            <p className="text-xs text-[#94A3B8]">{user?.email || 'user@tradesimx.ai'}</p>
            <div className="flex items-center space-x-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30">
                QUANT ACCOUNT
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                {PLATFORM_CONFIG.brandName} v{PLATFORM_CONFIG.version}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 font-bold text-xs border border-red-500/30 flex items-center space-x-2 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Paper Account Equity</span>
          <p className="text-2xl font-black text-white">${paperAcc?.total_equity?.toLocaleString() || '100,000.00'}</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <Workflow className="w-5 h-5 text-purple-400" />
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Active Simulation</span>
          <p className="text-2xl font-black text-emerald-400">+{paperAcc?.net_return_pct || 0}% Return</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Realized Profit</span>
          <p className="text-2xl font-black text-indigo-400">${paperAcc?.realized_pnl >= 0 ? '+' : ''}${paperAcc?.realized_pnl?.toLocaleString() || '0.00'}</p>
        </div>
      </div>
    </div>
  );
}
