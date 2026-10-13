import React from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { Layers, Workflow, LineChart, TrendingUp, Bot, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  const steps = [
    { num: '01', title: 'Choose Market & Asset', icon: Layers, desc: 'Select your target cryptocurrency (BTC-USD, ETH-USD, SOL-USD, BNB-USD), timeframe (1h, 4h, 1d), date range, and initial simulation capital.' },
    { num: '02', title: 'Build No-Code Strategy', icon: Workflow, desc: 'Construct visual rule conditions using RSI, SMA, EMA, MACD, Bollinger Bands, or ML directional signals with custom AND/OR logic.' },
    { num: '03', title: 'Run Historical Backtest', icon: LineChart, desc: 'Execute real bar-by-bar order simulation with slippage, exchange commission fees, Stop Loss, Take Profit, and Trailing Stops.' },
    { num: '04', title: 'Analyze Performance & Metrics', icon: TrendingUp, desc: 'Inspect equity growth curves, max drawdown underwater charts, Sharpe ratios, Sortino ratios, profit factors, and paginated trade logs.' },
    { num: '05', title: 'Optimize With AI Analyst', icon: Bot, desc: 'Engage with the Groq AI chatbot to critique metric flaws, optimize risk parameters, and export PDF/CSV audit reports.' }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            WORKFLOW GUIDE
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">How TradeSimX AI Works</h1>
          <p className="text-sm text-[#94A3B8]">A structured 5-step methodology from market data to AI-assisted optimization.</p>
        </div>

        <div className="space-y-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="terminal-card p-6 rounded-2xl border border-[#1F2937] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-lg shadow-indigo-500/20">
                    {s.num}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{s.title}</span>
                    </h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed max-w-2xl">{s.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-6">
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25"
          >
            <span>Start Step 1: Choose Market</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
