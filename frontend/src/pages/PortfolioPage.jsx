import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PieChart, TrendingUp, GitCompare, DollarSign, Layers } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await api.getPortfolioSummary();
      if (res.success) setPortfolio(res.portfolio);
    } catch (err) {
      console.error(err);
    }
  };

  const pieData = (portfolio?.assets || [
    { symbol: "BTC-USD", allocation_pct: 45.0, amount_usd: 45000 },
    { symbol: "ETH-USD", allocation_pct: 30.0, amount_usd: 30000 },
    { symbol: "SOL-USD", allocation_pct: 15.0, amount_usd: 15000 },
    { symbol: "BNB-USD", allocation_pct: 10.0, amount_usd: 10000 }
  ]).map(a => ({ name: a.symbol, value: a.amount_usd }));

  const COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#EAB308'];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Multi-Asset Portfolio Dashboard</h1>
          <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">Multi-Asset</span>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">
          Track crypto allocations, portfolio volatility, Sharpe ratio, and asset cross-correlation matrix.
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Total Portfolio Value</span>
          <p className="text-2xl font-black text-white">${portfolio?.total_value_usd?.toLocaleString() || '100,000'}</p>
          <p className="text-[11px] text-emerald-400 font-bold">+{portfolio?.portfolio_return_pct || 18.4}% Total Return</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Portfolio Volatility</span>
          <p className="text-2xl font-black text-purple-400">{portfolio?.volatility_pct || 14.2}%</p>
          <p className="text-[11px] text-[#64748B]">Annualized standard deviation</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Sharpe Ratio</span>
          <p className="text-2xl font-black text-indigo-400">{portfolio?.sharpe_ratio || 1.58}</p>
          <p className="text-[11px] text-emerald-400 font-bold">Sortino: {portfolio?.sortino_ratio || 2.15}</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Diversification Score</span>
          <p className="text-2xl font-black text-emerald-400">{portfolio?.diversification_score || 82.0}/100</p>
          <p className="text-[11px] text-[#64748B]">Optimal risk-weighted allocation</p>
        </div>
      </div>

      {/* Allocation Chart & Asset Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>Asset Allocation Pie Chart</span>
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff' }} />
              </RePie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Correlation Matrix */}
        <div className="lg:col-span-2 terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-purple-400" />
            <span>Asset Cross-Correlation Matrix</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs text-[#94A3B8]">
              <thead className="bg-[#070B14] text-[#64748B] uppercase text-[10px] font-bold border-b border-[#1F2937]">
                <tr>
                  <th className="py-3 px-4 text-left">Asset</th>
                  <th className="py-3 px-4">BTC-USD</th>
                  <th className="py-3 px-4">ETH-USD</th>
                  <th className="py-3 px-4">SOL-USD</th>
                  <th className="py-3 px-4">BNB-USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50 font-semibold text-white">
                <tr>
                  <td className="py-3.5 px-4 text-left font-bold text-indigo-400">BTC-USD</td>
                  <td className="py-3.5 px-4 bg-indigo-500/20 text-indigo-300 font-extrabold">1.00</td>
                  <td className="py-3.5 px-4">0.82</td>
                  <td className="py-3.5 px-4">0.68</td>
                  <td className="py-3.5 px-4">0.74</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 text-left font-bold text-purple-400">ETH-USD</td>
                  <td className="py-3.5 px-4">0.82</td>
                  <td className="py-3.5 px-4 bg-indigo-500/20 text-indigo-300 font-extrabold">1.00</td>
                  <td className="py-3.5 px-4">0.76</td>
                  <td className="py-3.5 px-4">0.71</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 text-left font-bold text-cyan-400">SOL-USD</td>
                  <td className="py-3.5 px-4">0.68</td>
                  <td className="py-3.5 px-4">0.76</td>
                  <td className="py-3.5 px-4 bg-indigo-500/20 text-indigo-300 font-extrabold">1.00</td>
                  <td className="py-3.5 px-4">0.62</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 text-left font-bold text-yellow-400">BNB-USD</td>
                  <td className="py-3.5 px-4">0.74</td>
                  <td className="py-3.5 px-4">0.71</td>
                  <td className="py-3.5 px-4">0.62</td>
                  <td className="py-3.5 px-4 bg-indigo-500/20 text-indigo-300 font-extrabold">1.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
