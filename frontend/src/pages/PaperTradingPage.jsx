import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Briefcase, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaperTradingPage({ selectedSymbol = 'BTC-USD' }) {
  const [sym, setSym] = useState(selectedSymbol);
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState(0.1);
  const [currentPrice, setCurrentPrice] = useState(94580.0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
    fetchPrice(sym);
  }, [sym]);

  const fetchSummary = async () => {
    try {
      const res = await api.getPaperSummary();
      if (res.success) setAccount(res.account);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrice = async (symbol) => {
    try {
      const res = await api.getOHLCV(symbol, '1h', 1);
      if (res.success && res.data && res.data.length > 0) {
        setCurrentPrice(res.data[res.data.length - 1].close);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrder = async (side) => {
    setLoading(true);
    setMsg(null);
    setError(null);
    try {
      const res = side === 'BUY' 
        ? await api.buyPaper(sym, amount, currentPrice)
        : await api.sellPaper(sym, amount, currentPrice);

      if (res.success) {
        setMsg(res.message);
        await fetchSummary();
      } else {
        setError(res.error || 'Failed to execute paper trade');
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Error executing paper trade');
    } finally {
      setLoading(false);
    }
  };

  const estimatedOrderValue = amount * currentPrice;

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Paper Trading Simulator</h1>
            <span className="px-2 py-0.5 text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">Simulated Capital</span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Execute virtual orders with initial ₹10,00,000 / $100,000 capital stored in MongoDB.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={sym}
            onChange={(e) => setSym(e.target.value)}
            className="bg-[#0B1120] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3.5 py-2.5 focus:outline-none"
          >
            <option value="BTC-USD">BTC-USD (Bitcoin)</option>
            <option value="ETH-USD">ETH-USD (Ethereum)</option>
            <option value="SOL-USD">SOL-USD (Solana)</option>
            <option value="BNB-USD">BNB-USD (Binance)</option>
          </select>

          <button
            onClick={fetchSummary}
            className="p-2.5 rounded-xl bg-[#1F2937] text-[#94A3B8] hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Balance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Total Account Equity</span>
          <p className="text-2xl font-black text-white">${account?.total_equity?.toLocaleString() || '100,000.00'}</p>
          <p className="text-[11px] text-emerald-400 font-bold">+{account?.net_return_pct || 0}% Net Return</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Available Cash Balance</span>
          <p className="text-2xl font-black text-indigo-400">${account?.cash_balance?.toLocaleString() || '100,000.00'}</p>
          <p className="text-[11px] text-[#64748B]">Virtual simulation cash</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Realized Profit / Loss</span>
          <p className="text-2xl font-black text-emerald-400">${account?.realized_pnl >= 0 ? '+' : ''}${account?.realized_pnl?.toLocaleString() || '0.00'}</p>
          <p className="text-[11px] text-[#64748B]">Closed trades profit</p>
        </div>

        <div className="terminal-card p-5 rounded-2xl border border-[#1F2937] space-y-2">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Unrealized P&L</span>
          <p className="text-2xl font-black text-cyan-400">${account?.unrealized_pnl >= 0 ? '+' : ''}${account?.unrealized_pnl?.toLocaleString() || '0.00'}</p>
          <p className="text-[11px] text-[#64748B]">Open positions mark-to-market</p>
        </div>
      </div>

      {/* Order Placement Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span>Place Paper Order ({sym})</span>
          </h3>

          {msg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Asset Symbol</label>
              <input
                type="text"
                disabled
                value={sym}
                className="w-full bg-[#070B14] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3 py-2 opacity-80"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Current Price (USD)</label>
              <input
                type="text"
                disabled
                value={`$${currentPrice.toLocaleString()}`}
                className="w-full bg-[#070B14] border border-[#1F2937] text-emerald-400 text-xs font-bold rounded-xl px-3 py-2 opacity-80"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Quantity ({sym.split('-')[0]})</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#070B14] border border-[#1F2937] text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#070B14] border border-[#1F2937] text-xs space-y-1">
              <div className="flex justify-between text-[#94A3B8]">
                <span>Estimated Order Value:</span>
                <span className="text-white font-bold">${estimatedOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Available Cash:</span>
                <span className="text-indigo-400 font-bold">${account?.cash_balance?.toLocaleString() || '100,000.00'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleOrder('BUY')}
                disabled={loading}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-1"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Paper BUY</span>
              </button>

              <button
                onClick={() => handleOrder('SELL')}
                disabled={loading}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20 flex items-center justify-center space-x-1"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Paper SELL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Open Positions Table */}
        <div className="lg:col-span-2 terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-4">
          <h3 className="text-sm font-bold text-white">Open Paper Positions</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#94A3B8]">
              <thead className="bg-[#070B14] text-[#64748B] uppercase text-[10px] font-bold border-b border-[#1F2937]">
                <tr>
                  <th className="py-3 px-4">Asset</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Entry Price</th>
                  <th className="py-3 px-4">Current Price</th>
                  <th className="py-3 px-4">Unrealized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50 font-medium">
                {account?.open_positions && account.open_positions.length > 0 ? (
                  account.open_positions.map((pos, idx) => (
                    <tr key={idx} className="hover:bg-[#070B14]/40">
                      <td className="py-3.5 px-4 font-bold text-white">{pos.symbol}</td>
                      <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">{pos.type}</span></td>
                      <td className="py-3.5 px-4 text-white font-bold">{pos.amount}</td>
                      <td className="py-3.5 px-4 text-white">${pos.entry_price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-indigo-400 font-bold">${pos.current_price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">${pos.unrealized_pnl >= 0 ? '+' : ''}${pos.unrealized_pnl} ({pos.unrealized_pnl_pct}%)</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-xs text-[#94A3B8]">No open positions currently. Place a Paper BUY order above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Trade History */}
          <div className="pt-4 border-t border-[#1F2937]">
            <h4 className="text-xs font-bold text-white mb-3">Recent Trade Transaction Logs</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#94A3B8]">
                <thead className="bg-[#070B14] text-[#64748B] uppercase text-[10px] font-bold border-b border-[#1F2937]">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Asset</th>
                    <th className="py-2 px-3">Side</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Price</th>
                    <th className="py-2 px-3">Order Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/50">
                  {account?.recent_trades && account.recent_trades.length > 0 ? (
                    account.recent_trades.slice().reverse().map((t, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-[#64748B]">{t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : '-'}</td>
                        <td className="py-2 px-3 font-bold text-white">{t.symbol}</td>
                        <td className="py-2 px-3"><span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${t.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{t.side}</span></td>
                        <td className="py-2 px-3 text-white">{t.amount}</td>
                        <td className="py-2 px-3 text-white">${t.price?.toLocaleString()}</td>
                        <td className="py-2 px-3 text-indigo-400 font-bold">${t.order_value?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-xs text-[#94A3B8]">No trade transactions logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
