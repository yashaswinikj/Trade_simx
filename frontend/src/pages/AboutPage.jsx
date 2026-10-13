import React from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { Cpu, ShieldCheck, BrainCircuit, LineChart, Bot, Database } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            OUR PURPOSE & TECHNOLOGY
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">About TradeSimX AI</h1>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            TradeSimX AI is an educational and analytical platform designed to bring algorithmic trading research, machine learning, historical backtesting and AI-powered analysis into one accessible environment.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Our Mission</span>
            <h3 className="text-xl font-bold text-white">Democratizing Quantitative Strategy Validation</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              To eliminate guesswork and subjective bias in cryptocurrency trading by providing accessible, mathematically rigorous backtesting engines and predictive analytics tools.
            </p>
          </div>

          <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-3">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Our Vision</span>
            <h3 className="text-xl font-bold text-white">Empowering Traders with AI & Data Science</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              To fuse modern machine learning classification models with conversational LLM intelligence, enabling traders to inspect flaws, drawdowns, and risk metrics effortlessly.
            </p>
          </div>
        </div>

        {/* Why ML, Backtesting, AI */}
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-white text-center">Core Pillars of the Platform</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="terminal-card p-5 rounded-xl border border-[#1F2937] space-y-3">
              <LineChart className="w-6 h-6 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Why Backtesting?</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Testing strategy logic against historical OHLCV candles reveals true profit factor, drawdown, and win rates before committing capital.
              </p>
            </div>

            <div className="terminal-card p-5 rounded-xl border border-[#1F2937] space-y-3">
              <BrainCircuit className="w-6 h-6 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Why Machine Learning?</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Supervised classification models (XGBoost & Random Forest) evaluate multi-indicator features to assign unbiased directional probabilities.
              </p>
            </div>

            <div className="terminal-card p-5 rounded-xl border border-[#1F2937] space-y-3">
              <Bot className="w-6 h-6 text-yellow-400" />
              <h3 className="text-sm font-bold text-white">Why AI Assistance?</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Groq LLM models convert natural language prompts into executable rule sets and critique metric flaws in plain language.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
