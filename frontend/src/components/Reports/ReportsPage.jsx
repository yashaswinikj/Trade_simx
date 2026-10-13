import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileSpreadsheet, Download, Bot, Eye, Calendar, Sparkles } from 'lucide-react';

export default function ReportsPage({ onSelectBacktestResult, onOpenAIChatWithContext }) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getBacktestHistory();
      if (res.success) {
        setReports(res.history || []);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-6 rounded-2xl border border-[#1F2937]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXECUTIVE REPORTING HUB</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Quantitative Performance Reports</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">Export publication-grade PDF & CSV audit documents for your trading strategies</p>
        </div>
      </div>

      {/* Reports Table */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h3 className="text-base font-bold text-white">Generated Strategy Reports</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-[#94A3B8] uppercase font-semibold">
                <th className="py-3 px-3">Strategy</th>
                <th className="py-3 px-3">Asset</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Net Return</th>
                <th className="py-3 px-3">Win Rate</th>
                <th className="py-3 px-3">Sharpe</th>
                <th className="py-3 px-3">Drawdown</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]">
              {reports.length > 0 ? (
                reports.map(r => (
                  <tr key={r.id} className="hover:bg-[#070B14]/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{r.strategy_name}</td>
                    <td className="py-3 px-3 text-indigo-400 font-semibold">{r.symbol}</td>
                    <td className="py-3 px-3 text-[#94A3B8]">{r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'Recent'}</td>
                    <td className={`py-3 px-3 font-black ${r.metrics?.net_profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {r.metrics?.net_profit_pct >= 0 ? '+' : ''}{r.metrics?.net_profit_pct?.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-white">{r.metrics?.win_rate?.toFixed(1)}%</td>
                    <td className="py-3 px-3 text-indigo-300 font-semibold">{r.metrics?.sharpe_ratio}</td>
                    <td className="py-3 px-3 text-red-400 font-semibold">{r.metrics?.max_drawdown_pct?.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => onSelectBacktestResult(r.id)}
                        className="p-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-white"
                        title="View Results"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => api.downloadPDFReport({ id: r.id, metrics: r.metrics, trades: [] }, r.strategy_name, r.symbol)}
                        className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        title="Download PDF Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenAIChatWithContext({ backtest: r })}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        title="Analyze with AI"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#94A3B8]">
                    No generated reports available yet. Run a backtest in the Strategy Builder tab to generate reports.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
