import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import AIAnalysisModal from '../AIAssistant/AIAnalysisModal';
import { 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Award, 
  ShieldAlert, 
  PieChart as PieIcon, 
  Download, 
  FileSpreadsheet, 
  Bot, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Line 
} from 'recharts';

export default function BacktestResults({ backtestId, onOpenAIChatWithContext, onBackToHistory }) {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);

  // Trade Table Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSide, setFilterSide] = useState('ALL'); // ALL, WINNERS, LOSERS
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // AI Modal Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState(null);

  useEffect(() => {
    if (backtestId) {
      loadBacktestResult(backtestId);
    }
  }, [backtestId]);

  const loadBacktestResult = async (id) => {
    setLoading(true);
    try {
      const res = await api.getBacktestResult(id);
      if (res.success && res.result) {
        setResultData(res.result);
      }
    } catch (err) {
      console.error('Error loading backtest result:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!resultData) return;
    setLoadingAI(true);
    setAiErrorMsg(null);
    setShowAIModal(true);
    try {
      const res = await api.analyzeBacktestAI(resultData.id);
      if (res.success && res.analysis) {
        setAiAnalysis(res);
      } else {
        setAiErrorMsg(res.error || 'AI analysis is temporarily unavailable. Please try again.');
      }
    } catch (err) {
      console.error('AI Analysis error:', err);
      setAiErrorMsg(err?.response?.data?.error || err.message || 'AI analysis is temporarily unavailable. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="terminal-card p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 border border-[#1F2937]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-white">Loading Quantitative Backtest Analytics...</p>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="terminal-card p-12 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-12 border border-[#1F2937]">
        <p className="text-[#94A3B8] text-sm">Backtest result not found.</p>
        <button
          onClick={onBackToHistory}
          className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-white font-bold text-xs rounded-xl"
        >
          Back to History
        </button>
      </div>
    );
  }

  const metrics = resultData.metrics || {};
  const equityCurve = resultData.equity_curve || [];
  const trades = resultData.trades || [];

  // Robust Currency Formatter
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    const num = Number(val);
    if (isNaN(num)) return '$0.00';
    const sign = num < 0 ? '-' : '';
    return `${sign}$${Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Dynamic Final Equity Lookup & Safe Fallback Calculation
  const getFinalEquity = (data) => {
    if (!data) return 0;
    const m = data.metrics || {};

    // 1. Direct key lookups across all potential key names
    let val = m.final_equity ?? m.total_equity ?? m.ending_equity ?? m.equity ?? m.final_balance ?? m.ending_balance ?? data.final_equity ?? data.total_equity ?? data.equity;

    // 2. Fallback calculation if direct key is missing or NaN
    if (val === undefined || val === null || isNaN(Number(val))) {
      const initialCap = typeof m.initial_capital === 'number' && !isNaN(m.initial_capital) ? m.initial_capital : (typeof data.initial_capital === 'number' && !isNaN(data.initial_capital) ? data.initial_capital : 10000);
      
      if (typeof m.net_profit === 'number' && !isNaN(m.net_profit)) {
        val = initialCap + m.net_profit;
      } else if (typeof m.net_profit_pct === 'number' && !isNaN(m.net_profit_pct)) {
        val = initialCap * (1.0 + m.net_profit_pct / 100.0);
      } else if (data.equity_curve && Array.isArray(data.equity_curve) && data.equity_curve.length > 0) {
        const lastPt = data.equity_curve[data.equity_curve.length - 1];
        if (lastPt && typeof lastPt.equity === 'number' && !isNaN(lastPt.equity)) {
          val = lastPt.equity;
        }
      }
    }

    const numVal = Number(val);
    return isNaN(numVal) ? 0 : numVal;
  };

  const finalEquityValue = getFinalEquity(resultData);
  const initialCapitalValue = typeof metrics.initial_capital === 'number' ? metrics.initial_capital : (typeof resultData.initial_capital === 'number' ? resultData.initial_capital : 10000);

  // Filter Trades
  const filteredTrades = trades.filter(t => {
    const matchesSearch = t.exit_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.side?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.pnl?.toString().includes(searchTerm);
    if (filterSide === 'WINNERS') return matchesSearch && t.pnl > 0;
    if (filterSide === 'LOSERS') return matchesSearch && t.pnl <= 0;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const paginatedTrades = filteredTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Win/Loss Pie Chart
  const pieData = [
    { name: 'Winning Trades', value: metrics.winning_trades || 0, color: '#22C55E' },
    { name: 'Losing Trades', value: metrics.losing_trades || 0, color: '#EF4444' }
  ];

  // Drawdown curve data calculation
  let peak = -Infinity;
  const drawdownCurve = equityCurve.map(pt => {
    if (pt.equity > peak) peak = pt.equity;
    const dd = peak > 0 ? ((pt.equity - peak) / peak) * 100 : 0;
    return { timestamp: pt.timestamp, drawdown: Math.round(dd * 100) / 100 };
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header Bar & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold mb-1">
            <span>BACKTEST RESULT ID: #{resultData.id.substring(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{resultData.strategy_name}</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">
            Asset: <span className="text-white font-bold">{resultData.symbol}</span> | Timeframe: <span className="text-white font-bold">{resultData.timeframe}</span> | Initial Capital: <span className="text-white font-bold">{formatCurrency(initialCapitalValue)}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => api.downloadPDFReport(resultData, resultData.strategy_name, resultData.symbol)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-xs font-bold text-white transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => api.downloadCSVReport(resultData)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-xs font-bold text-white transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRunAIAnalysis}
            disabled={loadingAI}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-yellow-300 ${loadingAI ? 'animate-spin' : ''}`} />
            <span>{loadingAI ? 'Analysing...' : 'Analyse with AI'}</span>
          </button>

          {onBackToHistory && (
            <button
              onClick={onBackToHistory}
              className="px-3.5 py-2 rounded-xl bg-[#070B14] border border-[#1F2937] hover:bg-[#111827] text-xs font-bold text-[#94A3B8] hover:text-white transition-colors"
            >
              Back to History
            </button>
          )}
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Net Profit */}
        <div className="terminal-card p-4 rounded-xl space-y-1.5 border border-[#1F2937]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Net Return</span>
          <p className={`text-xl font-black ${metrics.net_profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.net_profit_pct >= 0 ? '+' : ''}{metrics.net_profit_pct !== undefined && metrics.net_profit_pct !== null ? Number(metrics.net_profit_pct).toFixed(2) : '0.00'}%
          </p>
          <p className="text-[11px] text-[#64748B] font-medium">{formatCurrency(metrics.net_profit)}</p>
        </div>

        {/* Final Equity */}
        <div className="terminal-card p-4 rounded-xl space-y-1.5 border border-[#1F2937]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Final Equity</span>
          <p className="text-xl font-black text-white">{formatCurrency(finalEquityValue)}</p>
          <p className="text-[11px] text-[#64748B] font-medium">Cap: {formatCurrency(initialCapitalValue)}</p>
        </div>

        {/* Win Rate */}
        <div className="terminal-card p-4 rounded-xl space-y-1.5 border border-[#1F2937]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Win Rate</span>
          <p className="text-xl font-black text-indigo-400">{metrics.win_rate !== undefined && metrics.win_rate !== null ? Number(metrics.win_rate).toFixed(2) : '0.00'}%</p>
          <p className="text-[11px] text-[#64748B] font-medium">{metrics.winning_trades || 0}W / {metrics.losing_trades || 0}L ({metrics.total_trades || 0} T)</p>
        </div>

        {/* Sharpe Ratio */}
        <div className="terminal-card p-4 rounded-xl space-y-1.5 border border-[#1F2937]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Sharpe Ratio</span>
          <p className={`text-xl font-black ${metrics.sharpe_ratio >= 1.0 ? 'text-emerald-400' : (metrics.sharpe_ratio >= 0 ? 'text-amber-400' : 'text-red-400')}`}>
            {metrics.sharpe_ratio !== undefined && metrics.sharpe_ratio !== null ? Number(metrics.sharpe_ratio).toFixed(2) : '0.00'}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium">Risk-Adjusted Return</p>
        </div>

        {/* Profit Factor */}
        <div className="terminal-card p-4 rounded-xl space-y-1.5 border border-[#1F2937]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Profit Factor</span>
          <p className={`text-xl font-black ${metrics.profit_factor >= 1.5 ? 'text-emerald-400' : (metrics.profit_factor >= 1.0 ? 'text-amber-400' : 'text-red-400')}`}>
            {metrics.profit_factor !== undefined && metrics.profit_factor !== null ? Number(metrics.profit_factor).toFixed(2) : 'N/A'}
          </p>
          <p className="text-[11px] text-[#64748B] font-medium">Gross Win/Loss Ratio</p>
        </div>

        {/* Max Drawdown */}
        <div className="terminal-card p-4 rounded-xl space-y-1.5 border border-[#1F2937]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Max Drawdown</span>
          <p className="text-xl font-black text-red-400">{metrics.max_drawdown_pct !== undefined && metrics.max_drawdown_pct !== null ? Number(metrics.max_drawdown_pct).toFixed(2) : '0.00'}%</p>
          <p className="text-[11px] text-[#64748B] font-medium">Peak-to-Trough Decline</p>
        </div>
      </div>

      {/* Equity & Benchmark Performance Chart */}
      <div className="terminal-card p-6 rounded-2xl space-y-4 border border-[#1F2937]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white">Equity Growth vs Benchmark</h3>
            <p className="text-xs text-[#94A3B8]">Strategy portfolio curve (indigo) benchmarked against Buy & Hold (slate)</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            Strategy: {metrics.net_profit_pct >= 0 ? '+' : ''}{metrics.net_profit_pct?.toFixed(2)}%
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#070B14', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }}
                formatter={(val) => [`${formatCurrency(val)}`, '']}
              />
              <Area type="monotone" dataKey="equity" name="Strategy Equity" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGrad)" />
              <Line type="monotone" dataKey="benchmark_equity" name="Benchmark (Buy & Hold)" stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drawdown Chart & Secondary Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drawdown Waterfall Chart */}
        <div className="lg:col-span-2 terminal-card p-6 rounded-2xl space-y-4 border border-[#1F2937]">
          <h3 className="text-base font-extrabold text-white">Drawdown Underwater Curve (%)</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="timestamp" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="drawdown" name="Drawdown %" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win / Loss Ratio Breakdown */}
        <div className="terminal-card p-6 rounded-2xl space-y-4 border border-[#1F2937] flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-white">Win / Loss Breakdown</h3>
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#070B14', borderColor: '#1F2937', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-white">{metrics.win_rate !== undefined && metrics.win_rate !== null ? Number(metrics.win_rate).toFixed(1) : '0'}%</span>
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Win Rate</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-[#1F2937]">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-400 uppercase block">Wins</span>
              <span className="text-sm font-black text-white">{metrics.winning_trades || 0}</span>
            </div>
            <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20">
              <span className="text-[10px] font-bold text-red-400 uppercase block">Losses</span>
              <span className="text-sm font-black text-white">{metrics.losing_trades || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Trade Ledger Table */}
      <div className="terminal-card p-6 rounded-2xl space-y-4 border border-[#1F2937]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white">Execution Trade Ledger</h3>
            <p className="text-xs text-[#94A3B8]">Audit trail of simulated orders executed during backtest period</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-[#070B14] border border-[#1F2937] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Side Filter */}
            <select
              value={filterSide}
              onChange={(e) => { setFilterSide(e.target.value); setCurrentPage(1); }}
              className="bg-[#070B14] border border-[#1F2937] text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Trades</option>
              <option value="WINNERS">Profitable Only</option>
              <option value="LOSERS">Losses Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1F2937] text-[#94A3B8] font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Side</th>
                <th className="py-3 px-4">Entry Time</th>
                <th className="py-3 px-4">Exit Time</th>
                <th className="py-3 px-4">Entry Price</th>
                <th className="py-3 px-4">Exit Price</th>
                <th className="py-3 px-4">P&L ($)</th>
                <th className="py-3 px-4">Return (%)</th>
                <th className="py-3 px-4">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/50 text-[#CBD5E1]">
              {paginatedTrades.length > 0 ? (
                paginatedTrades.map((t, idx) => {
                  const realIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isProfit = t.pnl > 0;
                  return (
                    <tr key={idx} className="hover:bg-[#111827]/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B]">{realIdx}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${t.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {t.side || 'LONG'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">{t.entry_time}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">{t.exit_time}</td>
                      <td className="py-3 px-4 font-mono">${t.entry_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 font-mono">${t.exit_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(t.pnl)}
                      </td>
                      <td className={`py-3 px-4 font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}{t.pnl_pct?.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F2937] text-[#94A3B8]">
                          {t.exit_reason || 'SIGNAL'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748B]">
                    No trades match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#1F2937]">
            <span className="text-xs text-[#64748B]">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredTrades.length)} of {filteredTrades.length} trades
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-[#070B14] border border-[#1F2937] hover:bg-[#111827] text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white px-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-[#070B14] border border-[#1F2937] hover:bg-[#111827] text-white disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        title={`AI Backtest Analysis - #${resultData.id?.substring(0, 8)}`}
        analysisData={aiAnalysis}
        isLoading={loadingAI}
        errorMsg={aiErrorMsg}
      />

    </div>
  );
}
