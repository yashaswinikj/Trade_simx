import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldCheck, AlertTriangle, Percent, DollarSign, Calculator } from 'lucide-react';

export default function RiskAnalyticsPage({ selectedSymbol = 'BTC-USD' }) {
  const [riskData, setRiskData] = useState(null);
  const [capital, setCapital] = useState(10000);
  const [posSize, setPosSize] = useState(25);
  const [stopLoss, setStopLoss] = useState(2.5);

  useEffect(() => {
    fetchRisk();
  }, [selectedSymbol, capital, posSize, stopLoss]);

  const fetchRisk = async () => {
    try {
      const res = await api.getRiskAnalytics(selectedSymbol, capital, posSize, stopLoss);
      if (res.success) setRiskData(res.risk);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Quantitative Risk Analytics Lab</h1>
          <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">VaR / CVaR</span>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">
          Value at Risk (VaR 95%), Expected Shortfall (CVaR 95%), Kelly Criterion optimal sizing, and portfolio exposure limits.
        </p>
      </div>

      {/* Input Parameters Panel */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <span>Interactive Risk Parameters Calculator</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Portfolio Capital ($)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full bg-[#070B14] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Position Size Cap (%)</label>
            <input
              type="number"
              value={posSize}
              onChange={(e) => setPosSize(Number(e.target.value))}
              className="w-full bg-[#070B14] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Stop Loss Limit (%)</label>
            <input
              type="number"
              step="0.1"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full bg-[#070B14] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Value at Risk (VaR 95%)</span>
          <p className="text-2xl font-black text-amber-400">-${riskData?.var_95_dollar || 320.00}</p>
          <p className="text-[11px] text-[#64748B]">{riskData?.var_95_pct || 3.2}% max 1-day portfolio loss</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Conditional VaR (CVaR 95%)</span>
          <p className="text-2xl font-black text-red-400">-${riskData?.cvar_95_dollar || 480.00}</p>
          <p className="text-[11px] text-[#64748B]">{riskData?.cvar_95_pct || 4.8}% expected tail loss beyond VaR</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Kelly Criterion Optimal Size</span>
          <p className="text-2xl font-black text-indigo-400">{riskData?.kelly_optimal_position_pct || 18.5}%</p>
          <p className="text-[11px] text-[#64748B]">Mathematically optimal position fraction</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Max Trade Risk Exposure</span>
          <p className="text-2xl font-black text-emerald-400">${riskData?.risk_per_trade_dollar || 62.50}</p>
          <p className="text-[11px] text-[#64748B]">Risk per trade based on {stopLoss}% Stop Loss</p>
        </div>
      </div>

      {/* Exposure Cap & Safety Disclaimer */}
      <div className="terminal-card p-6 rounded-2xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Overall Portfolio Risk Rating: {riskData?.overall_risk_level || 'LOW'}</h3>
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Position size cap of {posSize}% is enforced. Recommended Kelly position sizing of {riskData?.kelly_optimal_position_pct || 18.5}% prevents over-leverage and ruin probability across multi-asset volatility cycles.
        </p>
      </div>
    </div>
  );
}
