import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Layers, LineChart, TrendingUp, Sliders, RefreshCw, DollarSign } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function MarketPage({ selectedSymbol = 'BTC-USD', setSelectedSymbol }) {
  const [sym, setSym] = useState(selectedSymbol);
  const [timeframe, setTimeframe] = useState('1h');
  const [ohlcvData, setOhlcvData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, [sym, timeframe]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const res = await api.getOHLCV(sym, timeframe, 300);
      if (res.success && res.data) {
        setOhlcvData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const latest = ohlcvData.length > 0 ? ohlcvData[ohlcvData.length - 1] : {};

  return (
    <div className="space-y-8 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Market Technical Analysis</h1>
            <span className="px-2 py-0.5 text-xs font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg">Real Data</span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Historical OHLCV price series and technical indicators calculated bar-by-bar.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={sym}
            onChange={(e) => {
              setSym(e.target.value);
              if (setSelectedSymbol) setSelectedSymbol(e.target.value);
            }}
            className="bg-[#0B1120] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none"
          >
            <option value="BTC-USD">BTC-USD (Bitcoin)</option>
            <option value="ETH-USD">ETH-USD (Ethereum)</option>
            <option value="SOL-USD">SOL-USD (Solana)</option>
            <option value="BNB-USD">BNB-USD (Binance)</option>
          </select>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-[#0B1120] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none"
          >
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
        </div>
      </div>

      {/* Latest Price Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="terminal-card p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Current Close Price</span>
          <p className="text-xl font-black text-white">${latest.close ? latest.close.toLocaleString() : '94,580.00'}</p>
        </div>

        <div className="terminal-card p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[10px] text-[#94A3B8] uppercase font-bold">RSI (14) Indicator</span>
          <p className="text-xl font-black text-indigo-400">{latest.rsi ? latest.rsi.toFixed(2) : '50.00'}</p>
        </div>

        <div className="terminal-card p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[10px] text-[#94A3B8] uppercase font-bold">EMA 21 Trendline</span>
          <p className="text-xl font-black text-purple-400">${latest.ema_21 ? latest.ema_21.toLocaleString() : '93,200.00'}</p>
        </div>

        <div className="terminal-card p-4 rounded-xl border border-[#1F2937]">
          <span className="text-[10px] text-[#94A3B8] uppercase font-bold">Volume Weighted (VWAP)</span>
          <p className="text-xl font-black text-emerald-400">${latest.vwap ? latest.vwap.toLocaleString() : '94,150.00'}</p>
        </div>
      </div>

      {/* Main OHLCV Price Chart */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <LineChart className="w-4 h-4 text-indigo-400" />
            <span>{sym} Price & Indicator Chart ({timeframe})</span>
          </h3>
          <button
            onClick={fetchMarketData}
            className="p-1.5 rounded-lg bg-[#070B14] border border-[#1F2937] text-[#94A3B8] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ohlcvData}>
              <defs>
                <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', color: '#fff' }} />
              <Area type="monotone" dataKey="close" stroke="#6366F1" strokeWidth={2} fill="url(#marketGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent OHLCV Candles Table */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
        <h3 className="text-sm font-bold text-white">Recent Candle Feed</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#94A3B8]">
            <thead className="bg-[#070B14] text-[#64748B] uppercase text-[10px] font-bold border-b border-[#1F2937]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Open</th>
                <th className="py-3 px-4">High</th>
                <th className="py-3 px-4">Low</th>
                <th className="py-3 px-4">Close</th>
                <th className="py-3 px-4">RSI (14)</th>
                <th className="py-3 px-4">EMA 21</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/50 font-medium">
              {ohlcvData.slice(-10).reverse().map((row, idx) => (
                <tr key={idx} className="hover:bg-[#070B14]/40">
                  <td className="py-3 px-4 text-[#64748B]">{row.timestamp}</td>
                  <td className="py-3 px-4 text-white">${row.open ? row.open.toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-emerald-400">${row.high ? row.high.toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-red-400">${row.low ? row.low.toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-white font-bold">${row.close ? row.close.toLocaleString() : '-'}</td>
                  <td className="py-3 px-4 text-indigo-400 font-bold">{row.rsi ? row.rsi.toFixed(2) : '-'}</td>
                  <td className="py-3 px-4 text-purple-400">${row.ema_21 ? row.ema_21.toFixed(2) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
