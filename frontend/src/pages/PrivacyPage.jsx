import React from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-[#94A3B8]">Last updated: August 2026</p>

        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4 text-xs text-[#94A3B8] leading-relaxed">
          <h3 className="text-sm font-bold text-white">1. Data Collection & Analytics</h3>
          <p>TradeSimX AI collects anonymized interaction data and local strategy configurations strictly for analytical execution and model backtesting within your session workspace.</p>

          <h3 className="text-sm font-bold text-white">2. Machine Learning & Groq API Processing</h3>
          <p>Strategy configurations passed to the AI Assistant module are transmitted securely to Groq LLM API endpoints. No private user financial passwords or personal bank details are collected or sold.</p>

          <h3 className="text-sm font-bold text-white">3. Local & Database Storage</h3>
          <p>Saved strategies and historical backtest logs are stored in your local MongoDB instance or fallback JSON database store.</p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
