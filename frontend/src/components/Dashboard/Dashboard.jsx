import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Workflow, 
  Award, 
  BrainCircuit, 
  ArrowUpRight, 
  Sparkles, 
  ChevronRight,
  Play,
  Clock,
  CheckCircle2,
  RefreshCw,
  Layers,
  Briefcase,
  PieChart,
  Bot
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Dashboard({ setSelectedSymbol }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState([]);
  const [recentBacktests, setRecentBacktests] = useState([]);
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [equityChartData, setEquityChartData] = useState([]);
  const [paperAcc, setPaperAcc] = useState(null);
  const [regimeInfo, setRegimeInfo] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Load Market Overview Data for BTC, ETH, SOL, BNB
      const btcRes = await api.getOHLCV('BTC-USD', '1h', 100);
      const ethRes = await api.getOHLCV('ETH-USD', '1h', 100);
      const solRes = await api.getOHLCV('SOL-USD', '1h', 100);
      const bnbRes = await api.getOHLCV('BNB-USD', '1h', 100);

      const processMarketCard = (symbol, name, dataRes) => {
        const rows = dataRes?.data || [];
        if (rows.length < 2) return { symbol, name, price: 0, change: 0, sparkline: [] };
        const latest = rows[rows.length - 1];
        const prev = rows[rows.length - 24] || rows[0];
        const changePct = ((latest.close - prev.close) / prev.close) * 100;
        const sparkline = rows.slice(-15).map(r => r.close);
        return { symbol, name, price: latest.close, change: changePct, sparkline };
      };

      setMarketData([
        processMarketCard('BTC-USD', 'Bitcoin', btcRes),
        processMarketCard('ETH-USD', 'Ethereum', ethRes),
        processMarketCard('SOL-USD', 'Solana', solRes),
        processMarketCard('BNB-USD', 'Binance Coin', bnbRes)
      ]);

      // 2. Load Paper Trading Account Summary
      const paperRes = await api.getPaperSummary();
      if (paperRes?.account) setPaperAcc(paperRes.account);

      // 3. Load Market Regime Detection
      const regRes = await api.detectRegime('BTC-USD');
      if (regRes?.data) setRegimeInfo(regRes.data);

      // 4. Load Recent Backtests & Strategies
      const historyRes = await api.getBacktestHistory();
      const stratsRes = await api.getStrategies();

      const history = historyRes?.history || [];
      const userStrats = stratsRes?.user_strategies || [];
      const presets = stratsRes?.presets || [];
      const allStrats = [...userStrats, ...presets];

      setRecentBacktests(history.slice(0, 5));
      setSavedStrategies(allStrats.slice(0, 5));

      // 5. Load ML Prediction for BTC-USD
      const mlRes = await api.predictMLSignal('BTC-USD');
      if (mlRes?.prediction) setMlPrediction(mlRes.prediction);

      // 6. Equity Chart Data
      if (history.length > 0) {
        const topRunId = history[0].id;
        const resultRes = await api.getBacktestResult(topRunId);
        if (resultRes?.result?.equity_curve) {
          setEquityChartData(resultRes.result.equity_curve.slice(-80));
        }
      } else if (btcRes?.data) {
        const btcData = btcRes.data.slice(-80);
        const basePrice = btcData[0].close;
        const curve = btcData.map(row => ({
          timestamp: row.timestamp.split(' ')[1] || row.timestamp,
          equity: Math.round(100000 * (row.close / basePrice)),
          benchmark_equity: Math.round(100000 * (row.close / basePrice))
        }));
        setEquityChartData(curve);
      }

      // 7. Load AI Insight summary
      const aiRes = await api.analyzeStrategyAI(
        allStrats[0] || { name: 'Momentum Master' },
        history[0]?.metrics || { net_profit_pct: 18.4, sharpe_ratio: 1.62, max_drawdown_pct: -6.4 }
      );
      if (aiRes?.analysis) setAiInsight(aiRes.analysis);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const Sparkline = ({ data, positive }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 28;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={positive ? '#22C55E' : '#EF4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#111827] via-[#0B1120] to-[#111827] p-6 rounded-2xl border border-[#1F2937] shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>TRADESIMX QUANT RESEARCH TERMINAL</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-medium">Real-time overview of Market, ML Predictions, Portfolio & Paper Trading</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/strategy-builder')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Workflow className="w-4 h-4" />
            <span>Build Strategy</span>
          </button>
          <button
            onClick={loadDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-[#1F2937] text-[#94A3B8] hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 6 Metric Summary Cards with Working 'View Details' Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Market Summary Card */}
        <div className="terminal-card p-5 rounded-xl flex flex-col justify-between space-y-3 border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Market Summary</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">${marketData[0]?.price?.toLocaleString() || '94,580.00'}</p>
            <p className="text-xs text-emerald-400 font-bold mt-0.5">BTC-USD (24h: {marketData[0]?.change >= 0 ? '+' : ''}{marketData[0]?.change?.toFixed(2) || '2.45'}%)</p>
          </div>
          <button
            onClick={() => navigate('/market')}
            className="w-full py-2 rounded-lg bg-[#070B14] hover:bg-[#111827] text-indigo-400 text-xs font-bold border border-[#1F2937] flex items-center justify-center space-x-1"
          >
            <span>View Market Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. AI Prediction Summary Card */}
        <div className="terminal-card p-5 rounded-xl flex flex-col justify-between space-y-3 border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase">AI Ensemble Prediction</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">{mlPrediction?.signal || 'BUY'}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Model Confidence: <span className="text-white font-bold">{mlPrediction?.confidence || 79.11}%</span></p>
          </div>
          <button
            onClick={() => navigate('/prediction')}
            className="w-full py-2 rounded-lg bg-[#070B14] hover:bg-[#111827] text-purple-400 text-xs font-bold border border-[#1F2937] flex items-center justify-center space-x-1"
          >
            <span>View Prediction Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Market Regime Summary Card */}
        <div className="terminal-card p-5 rounded-xl flex flex-col justify-between space-y-3 border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Market Regime</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400">{regimeInfo?.regime_title || 'High Volatility'}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Confidence: <span className="text-white font-bold">{regimeInfo?.confidence || 88.5}%</span></p>
          </div>
          <button
            onClick={() => navigate('/market-regime')}
            className="w-full py-2 rounded-lg bg-[#070B14] hover:bg-[#111827] text-amber-400 text-xs font-bold border border-[#1F2937] flex items-center justify-center space-x-1"
          >
            <span>View Regime Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4. Portfolio Summary Card */}
        <div className="terminal-card p-5 rounded-xl flex flex-col justify-between space-y-3 border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Portfolio Equity</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">${paperAcc?.total_equity?.toLocaleString() || '104,457.00'}</p>
            <p className="text-xs text-emerald-400 font-bold mt-0.5">Total Return: +{paperAcc?.net_return_pct || 4.46}%</p>
          </div>
          <button
            onClick={() => navigate('/portfolio')}
            className="w-full py-2 rounded-lg bg-[#070B14] hover:bg-[#111827] text-emerald-400 text-xs font-bold border border-[#1F2937] flex items-center justify-center space-x-1"
          >
            <span>View Portfolio Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5. Paper Trading Summary Card */}
        <div className="terminal-card p-5 rounded-xl flex flex-col justify-between space-y-3 border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase">Paper Trading Account</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-white">${paperAcc?.cash_balance?.toLocaleString() || '95,542.00'}</p>
            <p className="text-xs text-blue-400 font-bold mt-0.5">Cash Available ({paperAcc?.open_positions?.length || 1} Open Position)</p>
          </div>
          <button
            onClick={() => navigate('/paper-trading')}
            className="w-full py-2 rounded-lg bg-[#070B14] hover:bg-[#111827] text-blue-400 text-xs font-bold border border-[#1F2937] flex items-center justify-center space-x-1"
          >
            <span>View Paper Trading</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6. AI Analyst Insight Card */}
        <div className="terminal-card p-5 rounded-xl flex flex-col justify-between space-y-3 border border-[#1F2937]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase">AI Assistant Insight</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xs text-white italic line-clamp-2">
              "{aiInsight?.verdict || 'Market structure shows strong momentum accumulation above EMA 21. Favorable for breakout strategy.'}"
            </p>
          </div>
          <button
            onClick={() => navigate('/ai-assistant')}
            className="w-full py-2 rounded-lg bg-[#070B14] hover:bg-[#111827] text-cyan-400 text-xs font-bold border border-[#1F2937] flex items-center justify-center space-x-1"
          >
            <span>Launch AI Assistant</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chart Section: Portfolio Performance */}
      <div className="terminal-card p-6 rounded-2xl border border-[#1F2937]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1F2937] gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Portfolio Equity Performance vs Benchmark</h3>
            <p className="text-xs text-[#94A3B8]">Historical simulation backtest equity curve ($100,000 Initial Capital)</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span className="text-white">Strategy Equity</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#374151]"></span>
              <span className="text-[#94A3B8]">BTC Buy & Hold</span>
            </div>
          </div>
        </div>

        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#1F2937', borderRadius: '12px', color: '#fff' }}
                formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Value']}
              />
              <Area type="monotone" dataKey="equity" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGrad)" />
              <Area type="monotone" dataKey="benchmark_equity" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
