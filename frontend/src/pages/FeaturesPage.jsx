import React from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { 
  Workflow, 
  BrainCircuit, 
  LineChart, 
  Bot, 
  ShieldCheck, 
  FileSpreadsheet, 
  GitCompare, 
  Sliders, 
  TrendingUp, 
  Layers 
} from 'lucide-react';

export default function FeaturesPage() {
  const featureList = [
    { title: 'No-Code Strategy Builder', icon: Workflow, desc: 'Construct rule-based entry and exit conditions visually without coding using indicators like RSI, SMA, EMA, and MACD.' },
    { title: 'Technical Indicators Engine', icon: Sliders, desc: 'Calculates exact formulas for RSI, Moving Averages, Bollinger Bands, ATR, VWAP, Stochastic, and Volatility.' },
    { title: 'Cryptocurrency Datasets', icon: Layers, desc: 'Preprocessed historical OHLCV candles for BTC-USD, ETH-USD, SOL-USD, and BNB-USD with Binance API fallback.' },
    { title: 'Machine Learning Engine', icon: BrainCircuit, desc: 'Train XGBoost & Random Forest classifiers on multi-indicator features to predict 3-bar directional price signals.' },
    { title: 'Realistic Backtesting Engine', icon: LineChart, desc: 'Bar-by-bar order simulation featuring commission fees, slippage, Stop-Loss, Take-Profit, and Trailing Stops.' },
    { title: 'Risk & Position Sizing', icon: ShieldCheck, desc: 'Enforce position sizing caps (% of capital) and drawdown limits to protect portfolio equity.' },
    { title: 'Performance Analytics', icon: TrendingUp, desc: 'Detailed Sharpe Ratio, Sortino Ratio, Max Drawdown, Win Rate, Profit Factor, Expectancy, and trade logs.' },
    { title: 'Groq AI Strategy Analyst', icon: Bot, desc: 'Multi-turn context-aware LLM chatbot for strategy critiques, prompt parsing, and metric explanations.' },
    { title: 'Strategy Comparison Studio', icon: GitCompare, desc: 'Side-by-side performance matrix and comparison bar charts across multiple saved strategies.' },
    { title: 'Audit Report Exports', icon: FileSpreadsheet, desc: 'Download publication-grade PDF performance summaries and CSV trade execution logs.' }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            COMPREHENSIVE CAPABILITIES
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Platform Features</h1>
          <p className="text-sm text-[#94A3B8]">Everything you need to build, evaluate, and optimize algorithmic crypto trading strategies.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="terminal-card p-6 rounded-2xl border border-[#1F2937] hover:border-indigo-500/40 transition-colors space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
