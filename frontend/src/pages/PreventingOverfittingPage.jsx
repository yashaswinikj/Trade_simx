import React from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { ShieldCheck, BookOpen, Clock, GitCommit, CheckCircle2, Lock } from 'lucide-react';

export default function PreventingOverfittingPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            ACADEMIC VIVA DEFENSE GUIDE
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">How TradeSimX Prevents Overfitting</h1>
          <p className="text-sm text-[#94A3B8]">
            Rigorous methodologies ensuring machine learning models and backtesting engines eliminate lookahead bias and dataset leakage.
          </p>
        </div>

        {/* 4 Pillars of Overfitting Defense */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Strict Chronological Train-Test Splits</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Standard cross-validation randomly shuffles rows, introducing severe lookahead bias in time series. TradeSimX enforces strict chronological splitting (80% historical past for training, 20% unseen future for testing) with ZERO random shuffling.
            </p>
          </div>

          <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Walk-Forward Rolling Out-of-Sample Validation</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Strategies are trained on historical window \(T_0 \dots T_1\) and evaluated on unseen future window \(T_1 \dots T_2\). The window rolls forward sequentially across multiple market regimes to verify out-of-sample stability.
            </p>
          </div>

          <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Feature Scaling & Preprocessing Safety</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              StandardScaler parameters (mean \(\mu\) and variance \(\sigma^2\)) are fitted ONLY on the training dataset. Test features are scaled using the training parameters to prevent data leakage from the future into the past.
            </p>
          </div>

          <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">4. Realistic Transaction Friction & Slippage</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Backtests penalize every order with exchange commission fees (0.1%) and order book slippage (0.05%), preventing over-optimistic trade results on high-frequency noise.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
