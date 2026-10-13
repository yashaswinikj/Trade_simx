import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { GitCompare, Award, CheckSquare, Square, TrendingUp, ShieldAlert, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function StrategyComparison() {
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [backtestResults, setBacktestResults] = useState([]);

  useEffect(() => {
    loadComparisonData();
  }, []);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const historyRes = await api.getBacktestHistory();
      const history = historyRes?.history || [];

      if (history.length > 0) {
        setBacktestResults(history);
        const defaultSelected = history.slice(0, 3).map(h => h.id);
        setSelectedIds(defaultSelected);
      } else {
        // Run mock presets backtest to populate if empty
        const presets = [
          { name: 'RSI Oversold Momentum', symbol: 'BTC-USD', net_profit_pct: 22.4, win_rate: 61.2, sharpe_ratio: 1.65, profit_factor: 1.84, max_drawdown_pct: -8.4, total_trades: 42 },
          { name: 'MACD Trend Following', symbol: 'BTC-USD', net_profit_pct: 18.2, win_rate: 54.0, sharpe_ratio: 1.42, profit_factor: 1.58, max_drawdown_pct: -12.1, total_trades: 56 },
          { name: 'XGBoost AI Predictive', symbol: 'BTC-USD', net_profit_pct: 28.6, win_rate: 64.5, sharpe_ratio: 1.92, profit_factor: 2.10, max_drawdown_pct: -6.2, total_trades: 38 }
        ];
        setBacktestResults(presets.map((p, i) => ({ id: `preset_${i}`, strategy_name: p.name, symbol: p.symbol, metrics: p })));
        setSelectedIds(presets.map((_, i) => `preset_${i}`));
      }
    } catch (err) {
      console.error('Error loading comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const activeResults = backtestResults.filter(r => selectedIds.includes(r.id));

  // Chart data formatting
  const chartData = activeResults.map(r => ({
    name: r.strategy_name || 'Strategy',
    return: r.metrics?.net_profit_pct || 0,
    winRate: r.metrics?.win_rate || 0,
    sharpe: (r.metrics?.sharpe_ratio || 0) * 10,
    drawdown: Math.abs(r.metrics?.max_drawdown_pct || 0)
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 mb-1">
            <GitCompare className="w-4 h-4" />
            <span>QUANT STRATEGY COMPARISON STUDIO</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Strategy Performance Comparison</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">Compare returns, Sharpe ratios, drawdowns, and trade statistics side-by-side</p>
        </div>
      </div>

      {/* Multi-Select Strategy Selector Bar */}
      <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-3">
        <span className="text-xs font-bold text-white uppercase tracking-wider">Select Strategies to Compare:</span>
        <div className="flex flex-wrap gap-3">
          {backtestResults.map(r => {
            const isSelected = selectedIds.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleSelect(r.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected ? 'bg-indigo-500/20 text-white border-indigo-500/50 shadow-md shadow-indigo-500/10' :
                  'bg-[#070B14] text-[#94A3B8] border-[#1F2937] hover:border-gray-600'
                }`}
              >
                {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4 text-gray-500" />}
                <span>{r.strategy_name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Net Return (%) & Sharpe Ratio Comparison</span>
        </h3>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="return" name="Net Return (%)" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="drawdown" name="Max Drawdown (%)" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table Matrix */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h3 className="text-base font-bold text-white">Side-by-Side Comparison Matrix</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-[#94A3B8] uppercase font-semibold">
                <th className="py-3 px-4">Metric</th>
                {activeResults.map(r => (
                  <th key={r.id} className="py-3 px-4 text-white font-bold">{r.strategy_name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Asset Pair</td>
                {activeResults.map(r => <td key={r.id} className="py-3 px-4 text-white font-bold">{r.symbol}</td>)}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Net Return (%)</td>
                {activeResults.map(r => (
                  <td key={r.id} className={`py-3 px-4 font-black ${r.metrics?.net_profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.metrics?.net_profit_pct >= 0 ? '+' : ''}{r.metrics?.net_profit_pct?.toFixed(2)}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Sharpe Ratio</td>
                {activeResults.map(r => <td key={r.id} className="py-3 px-4 font-bold text-indigo-400">{r.metrics?.sharpe_ratio}</td>)}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Win Rate (%)</td>
                {activeResults.map(r => <td key={r.id} className="py-3 px-4 text-white font-bold">{r.metrics?.win_rate?.toFixed(1)}%</td>)}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Profit Factor</td>
                {activeResults.map(r => <td key={r.id} className="py-3 px-4 text-purple-300 font-bold">{r.metrics?.profit_factor}</td>)}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Max Drawdown (%)</td>
                {activeResults.map(r => <td key={r.id} className="py-3 px-4 text-red-400 font-bold">{r.metrics?.max_drawdown_pct?.toFixed(2)}%</td>)}
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#94A3B8]">Total Trades</td>
                {activeResults.map(r => <td key={r.id} className="py-3 px-4 text-white">{r.metrics?.total_trades}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
