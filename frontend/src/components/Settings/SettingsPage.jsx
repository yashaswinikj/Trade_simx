import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Settings as SettingsIcon, User, Key, ShieldCheck, Database, Bell } from 'lucide-react';

export default function SettingsPage({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [backendStatus, setBackendStatus] = useState(null);
  const [groqKeyInput, setGroqKeyInput] = useState('••••••••••••••••••••••••••••');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getProfile().then(res => {
      // Profile loaded
    });
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setBackendStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 mb-1">
            <SettingsIcon className="w-4 h-4" />
            <span>PLATFORM CONFIGURATION</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Platform Settings</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">Manage user profile, backend connections, and Groq API integrations</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#1F2937] pb-3">
        {[
          { id: 'profile', label: 'User Profile', icon: User },
          { id: 'api', label: 'API Configuration', icon: Key },
          { id: 'preferences', label: 'Preferences', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/20' : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          ✓ Settings saved successfully!
        </div>
      )}

      {/* SUB TAB 1: PROFILE */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-5">
          <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3">Account Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name || 'Alex Vance'}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Email Address</label>
              <input
                type="email"
                defaultValue={user?.email || 'trader@tradesimx.ai'}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Account Role</label>
              <input
                type="text"
                disabled
                value="Institutional Pro Quant"
                className="w-full bg-[#070B14]/50 border border-[#1F2937] rounded-xl px-4 py-2.5 text-sm text-indigo-400 font-bold focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* SUB TAB 2: API CONFIGURATION */}
      {activeSubTab === 'api' && (
        <form onSubmit={handleSaveSettings} className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-5">
          <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3">AI & Database Connections</h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#94A3B8]">Groq API Key (Environment Variable: GROQ_API_KEY)</label>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  backendStatus?.groq_api_configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {backendStatus?.groq_api_configured ? 'API Key Configured' : 'Using Rule-Based Fallback'}
                </span>
              </div>
              <input
                type="password"
                value={groqKeyInput}
                onChange={(e) => setGroqKeyInput(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Get your free key from console.groq.com. Never exposed in public client bundles.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-2">
              <span className="text-xs font-bold text-white block">MongoDB Connection Status</span>
              <div className="flex items-center space-x-2 text-xs">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">{backendStatus?.database_type || 'MongoDB Engine'}</span>
                <span className="text-[#94A3B8]">(mongodb://localhost:27017/tradesimx)</span>
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Update API Configuration
            </button>
          </div>
        </form>
      )}

      {/* SUB TAB 3: PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3">Platform Preferences</h3>
          
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
              <div>
                <span className="font-bold text-white block">Default Timeframe</span>
                <span className="text-[#94A3B8]">Default candle period for strategy backtesting</span>
              </div>
              <select className="bg-[#111827] border border-[#1F2937] text-white px-3 py-1.5 rounded-lg focus:outline-none">
                <option value="1h">1 Hour (1h)</option>
                <option value="4h">4 Hours (4h)</option>
                <option value="1d">1 Day (1d)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#070B14] border border-[#1F2937]">
              <div>
                <span className="font-bold text-white block">Terminal Theme</span>
                <span className="text-[#94A3B8]">Dark Trading Terminal Aesthetics</span>
              </div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                Dark Terminal
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
