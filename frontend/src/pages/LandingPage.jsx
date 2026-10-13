import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { 
  Workflow, 
  BrainCircuit, 
  LineChart, 
  Bot, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  Database,
  PieChart,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { PLATFORM_CONFIG } from '../config/platformConfig';

export default function LandingPage() {
  const heroChartData = [
    { time: '00:00', price: 62000, equity: 100000 },
    { time: '04:00', price: 62400, equity: 101200 },
    { time: '08:00', price: 61800, equity: 100800 },
    { time: '12:00', price: 63200, equity: 104500 },
    { time: '16:00', price: 64100, equity: 108900 },
    { time: '20:00', price: 63900, equity: 108200 },
    { time: '24:00', price: 65800, equity: 114200 },
    { time: '04:00', price: 66400, equity: 118400 }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#1F2937]/50">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              <span>AI-POWERED CRYPTOCURRENCY TRADING RESEARCH PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              TradeSimX AI <br />
              <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-purple-400 bg-clip-text text-transparent">
                Build. Backtest. Predict. Optimize.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#94A3B8] font-normal leading-relaxed">
              An AI-powered cryptocurrency trading research platform that helps users build strategies, test them against historical market data, understand performance and analyze results with machine learning and AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#111827] hover:bg-[#1F2937] text-white font-bold text-sm border border-[#1F2937] transition-all"
              >
                Explore Platform Terminal
              </Link>
            </div>
          </div>

          {/* Hero Visual Trading Terminal Preview Mockup */}
          <div className="mt-14 max-w-5xl mx-auto terminal-card rounded-2xl border border-indigo-500/30 p-4 sm:p-6 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center justify-between pb-4 border-b border-[#1F2937] text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="font-bold text-white ml-2">BTC-USD 1h • Backtest Simulation Studio</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                  ML Signal: BUY (79.1%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <div className="lg:col-span-2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={heroChartData}>
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff' }} />
                    <Area type="monotone" dataKey="equity" stroke="#6366F1" strokeWidth={2.5} fill="url(#heroGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#070B14] p-4 rounded-xl border border-[#1F2937] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">AI Analyst Review</span>
                  <p className="text-xs text-white font-medium leading-relaxed italic">
                    "Strategy demonstrates strong risk-adjusted returns with a Sharpe ratio of 1.62 and controlled max drawdown."
                  </p>
                </div>
                <div className="space-y-2 border-t border-[#1F2937] pt-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Net Return:</span><span className="text-emerald-400 font-bold">+18.4%</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Win Rate:</span><span className="text-white font-bold">62.5%</span></div>
                  <div className="flex justify-between"><span className="text-[#94A3B8]">Sharpe Ratio:</span><span className="text-indigo-400 font-bold">1.62</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS PIPELINE SECTION */}
      <section className="py-16 bg-[#0B1120] border-b border-[#1F2937]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">SYSTEM DATA PIPELINE ARCHITECTURE</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-8">How TradeSimX AI Works</h2>
          
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-white">
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Market Data</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Technical Analysis</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Machine Learning</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Market Regime</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Strategy</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Backtesting</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-[#111827] border border-[#1F2937]">Risk Analysis</span>
            <span className="text-indigo-400">→</span>
            <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Paper Trading</span>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 max-w-5xl mx-auto px-4 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-[#111827] to-purple-900/40 border border-indigo-500/30 space-y-6">
          <h2 className="text-3xl font-extrabold text-white">Start Exploring TradeSimX AI</h2>
          <p className="text-xs text-[#94A3B8] max-w-xl mx-auto">
            Test strategy logic against real historical data, train machine learning models, and optimize risk parameters in seconds.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
