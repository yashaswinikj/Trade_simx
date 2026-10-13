import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Layers, ShieldAlert, TrendingUp, Sparkles, Activity, MessageSquare } from 'lucide-react';

export default function MarketRegimePage({ selectedSymbol = 'BTC-USD' }) {
  const [regimeData, setRegimeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegime();
  }, [selectedSymbol]);

  const fetchRegime = async () => {
    setLoading(true);
    try {
      const res = await api.detectRegime(selectedSymbol);
      if (res.success) setRegimeData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Market Regime & Sentiment Lab</h1>
          <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">Real-Time</span>
        </div>
        <p className="text-xs text-[#94A3B8] mt-1">
          Mathematical trend regime classification and NLP sentiment analysis for {selectedSymbol}.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regime Classification Banner */}
        <div className="lg:col-span-2 terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Detected Market Regime</span>
                <h2 className="text-2xl font-extrabold text-white">{regimeData?.regime_title || 'Bull Trend'}</h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
              Confidence: {regimeData?.confidence || 92.0}%
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed bg-[#070B14] p-4 rounded-xl border border-[#1F2937]">
            "{regimeData?.description || 'Sustained upward price trend with strong buyer volume above key moving averages.'}"
          </p>

          {/* Regime Key Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-1">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Trend Strength (ADX)</span>
              <p className="text-lg font-extrabold text-indigo-400">{regimeData?.adx_strength || 34.5}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-1">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Volatility Rating</span>
              <p className="text-lg font-extrabold text-purple-400">{regimeData?.volatility_pct || 1.8}%</p>
            </div>
            <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-1">
              <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Composite AI Signal</span>
              <p className="text-lg font-extrabold text-emerald-400">{regimeData?.composite_signal || 'STRONG BUY'}</p>
            </div>
          </div>

          {/* Recommended Strategy */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Recommended Adaptive Strategy</span>
            <p className="text-xs font-bold text-white">{regimeData?.recommended_strategy || 'Trend Following (EMA Cross & RSI Pullback)'}</p>
          </div>
        </div>

        {/* Sentiment Analysis Panel */}
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">NLP Market Sentiment</h3>
              <span className="text-[10px] text-[#94A3B8]">Aggregated Crypto Text Data</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Positive Sentiment</span>
                <span className="text-emerald-400 font-bold">{regimeData?.sentiment?.positive_pct || 64.5}%</span>
              </div>
              <div className="w-full bg-[#070B14] h-2 rounded-full overflow-hidden border border-[#1F2937]">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${regimeData?.sentiment?.positive_pct || 64.5}%` }} />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Neutral Sentiment</span>
                <span className="text-amber-400 font-bold">{regimeData?.sentiment?.neutral_pct || 25.5}%</span>
              </div>
              <div className="w-full bg-[#070B14] h-2 rounded-full overflow-hidden border border-[#1F2937]">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${regimeData?.sentiment?.neutral_pct || 25.5}%` }} />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-white">Negative Sentiment</span>
                <span className="text-red-400 font-bold">{regimeData?.sentiment?.negative_pct || 10.0}%</span>
              </div>
              <div className="w-full bg-[#070B14] h-2 rounded-full overflow-hidden border border-[#1F2937]">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${regimeData?.sentiment?.negative_pct || 10.0}%` }} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1F2937] text-center">
            <span className="text-xs text-[#94A3B8]">Overall Market Sentiment: </span>
            <span className="text-xs font-extrabold text-emerald-400">{regimeData?.sentiment?.overall || 'BULLISH / POSITIVE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
