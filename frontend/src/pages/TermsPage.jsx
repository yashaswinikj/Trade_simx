import React from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-6">
        <h1 className="text-3xl font-extrabold text-white">Terms of Service & Risk Disclaimer</h1>
        <p className="text-xs text-[#94A3B8]">Last updated: August 2026</p>

        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4 text-xs text-[#94A3B8] leading-relaxed">
          <h3 className="text-sm font-bold text-white">1. Educational & Analytical Purpose Only</h3>
          <p>TradeSimX AI is designed for educational, research, and simulation purposes. The platform provides backtest execution, indicator calculations, and machine learning classification probabilities.</p>

          <h3 className="text-sm font-bold text-white">2. No Guaranteed Returns</h3>
          <p>Past performance in historical backtests does not guarantee future market results. Cryptocurrency trading involves substantial financial risk. ML predictions are probabilistic estimates and should not be treated as financial advice.</p>

          <h3 className="text-sm font-bold text-white">3. User Responsibility</h3>
          <p>Users are solely responsible for evaluating trading strategies and managing personal investment risk.</p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
