import React, { useState } from 'react';
import { api } from '../../services/api';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  DollarSign,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';

export default function StrategyBuilder({ selectedSymbol, setSelectedSymbol, onBacktestComplete }) {
  const [currentStep, setCurrentStep] = useState(1);

  // Market Config
  const [strategyName, setStrategyName] = useState('My Algorithmic Strategy');
  const [symbol, setSymbol] = useState(selectedSymbol || 'BTC-USD');
  const [timeframe, setTimeframe] = useState('1h');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [commissionPct, setCommissionPct] = useState(0.1);
  const [slippagePct, setSlippagePct] = useState(0.05);

  // Conditions
  const [logicOperator, setLogicOperator] = useState('AND');
  const [entryConditions, setEntryConditions] = useState([
    { indicator: 'rsi', operator: '<', value: '30' },
    { indicator: 'close', operator: '>', value: 'ema_21' }
  ]);
  const [exitConditions, setExitConditions] = useState([
    { indicator: 'rsi', operator: '>', value: '70' }
  ]);

  // Risk Management
  const [stopLossPct, setStopLossPct] = useState(2.5);
  const [takeProfitPct, setTakeProfitPct] = useState(6.0);
  const [trailingStopPct, setTrailingStopPct] = useState(1.5);
  const [positionSizePct, setPositionSizePct] = useState(25.0);

  // Execution Progress Modal State
  const [isExecuting, setIsExecuting] = useState(false);
  const [execStep, setExecStep] = useState(0);
  const [execError, setExecError] = useState(null);

  const availableIndicators = [
    { id: 'close', label: 'Close Price' },
    { id: 'rsi', label: 'RSI (Relative Strength Index)' },
    { id: 'sma_20', label: 'SMA 20' },
    { id: 'sma_50', label: 'SMA 50' },
    { id: 'sma_200', label: 'SMA 200' },
    { id: 'ema_9', label: 'EMA 9' },
    { id: 'ema_21', label: 'EMA 21' },
    { id: 'macd_hist', label: 'MACD Histogram' },
    { id: 'bb_lower', label: 'Bollinger Band Lower' },
    { id: 'bb_upper', label: 'Bollinger Band Upper' },
    { id: 'vwap', label: 'VWAP' },
    { id: 'volatility', label: 'Volatility (20d)' },
    { id: 'ml_signal', label: 'ML Direction Signal (BUY/SELL)' }
  ];

  const availableOperators = [
    { id: '>', label: 'Greater Than (>)' },
    { id: '<', label: 'Less Than (<)' },
    { id: '>=', label: 'Greater Than or Equal (>=)' },
    { id: '<=', label: 'Less Than or Equal (<=)' },
    { id: '==', label: 'Equals (==)' }
  ];

  // Phase 19 Presets Loader
  const loadPreset = (presetType) => {
    if (presetType === 'sma_cross') {
      setStrategyName('SMA Golden Cross Trend');
      setEntryConditions([
        { indicator: 'sma_20', operator: '>', value: 'sma_50' },
        { indicator: 'close', operator: '>', value: 'vwap' }
      ]);
      setExitConditions([
        { indicator: 'sma_20', operator: '<', value: 'sma_50' }
      ]);
      setStopLossPct(3.0);
      setTakeProfitPct(8.0);
    } else if (presetType === 'rsi_reversion') {
      setStrategyName('RSI Oversold Mean Reversion');
      setEntryConditions([
        { indicator: 'rsi', operator: '<', value: '30' },
        { indicator: 'close', operator: '>', value: 'ema_21' }
      ]);
      setExitConditions([
        { indicator: 'rsi', operator: '>', value: '70' }
      ]);
      setStopLossPct(2.0);
      setTakeProfitPct(5.0);
    } else if (presetType === 'macd_momentum') {
      setStrategyName('MACD Histogram Expansion');
      setEntryConditions([
        { indicator: 'macd_hist', operator: '>', value: '0' },
        { indicator: 'rsi', operator: '>', value: '50' }
      ]);
      setExitConditions([
        { indicator: 'macd_hist', operator: '<', value: '0' }
      ]);
      setStopLossPct(2.5);
      setTakeProfitPct(6.5);
    }
  };

  const handleAddCondition = (type) => {
    const newCond = { indicator: 'rsi', operator: '<', value: '30' };
    if (type === 'entry') setEntryConditions([...entryConditions, newCond]);
    else setExitConditions([...exitConditions, newCond]);
  };

  const handleRemoveCondition = (type, index) => {
    if (type === 'entry') setEntryConditions(entryConditions.filter((_, i) => i !== index));
    else setExitConditions(exitConditions.filter((_, i) => i !== index));
  };

  const handleUpdateCondition = (type, index, field, value) => {
    const list = type === 'entry' ? [...entryConditions] : [...exitConditions];
    list[index][field] = value;
    if (type === 'entry') setEntryConditions(list);
    else setExitConditions(list);
  };

  // Run Real Backend Backtest
  const handleExecuteBacktest = async () => {
    setIsExecuting(true);
    setExecError(null);
    setExecStep(1); // 1: Loading data

    try {
      setTimeout(() => setExecStep(2), 400); // 2: Calculating indicators
      setTimeout(() => setExecStep(3), 800); // 3: Simulating trades

      const strategyPayload = {
        name: strategyName,
        rules: {
          entry_conditions: entryConditions,
          exit_conditions: exitConditions,
          logic_operator: logicOperator
        },
        risk_management: {
          stop_loss_pct: parseFloat(stopLossPct),
          take_profit_pct: parseFloat(takeProfitPct),
          trailing_stop_pct: parseFloat(trailingStopPct),
          position_size: parseFloat(positionSizePct)
        }
      };

      const res = await api.runBacktest({
        symbol: symbol,
        timeframe: timeframe,
        strategy: strategyPayload,
        initial_capital: parseFloat(initialCapital),
        commission_pct: parseFloat(commissionPct),
        slippage_pct: parseFloat(slippagePct)
      });

      setExecStep(4); // 4: Calculating metrics
      setTimeout(() => setExecStep(5), 1100); // 5: AI analysis complete

      setTimeout(() => {
        setIsExecuting(false);
        if (res.success && res.result?.id) {
          onBacktestComplete(res.result.id);
        } else {
          setExecError(res.error || 'Failed to execute backtest.');
        }
      }, 1500);

    } catch (err) {
      console.error('Backtest error:', err);
      setIsExecuting(false);
      setExecError(err.response?.data?.error || err.message || 'Error running backtest on server.');
    }
  };

  const steps = [
    { num: 1, name: 'Market' },
    { num: 2, name: 'Entry Rules' },
    { num: 3, name: 'Exit Rules' },
    { num: 4, name: 'Risk Management' },
    { num: 5, name: 'Review & Run' }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header & Presets Loader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] p-5 rounded-2xl border border-[#1F2937]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <span>Strategy Builder</span>
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Construct visual rule-based quantitative trading algorithms</p>
        </div>

        {/* Try Demo Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#94A3B8] font-medium hidden md:inline">Try Demo:</span>
          <button
            onClick={() => loadPreset('sma_cross')}
            className="px-2.5 py-1.5 rounded-lg bg-[#1F2937] hover:bg-indigo-500/20 hover:border-indigo-500/40 text-xs font-semibold text-indigo-300 border border-[#374151] transition-colors"
          >
            SMA Cross
          </button>
          <button
            onClick={() => loadPreset('rsi_reversion')}
            className="px-2.5 py-1.5 rounded-lg bg-[#1F2937] hover:bg-emerald-500/20 hover:border-emerald-500/40 text-xs font-semibold text-emerald-300 border border-[#374151] transition-colors"
          >
            RSI Oversold
          </button>
          <button
            onClick={() => loadPreset('macd_momentum')}
            className="px-2.5 py-1.5 rounded-lg bg-[#1F2937] hover:bg-purple-500/20 hover:border-purple-500/40 text-xs font-semibold text-purple-300 border border-[#374151] transition-colors"
          >
            MACD Momentum
          </button>
        </div>
      </div>

      {/* Workflow Step Progress Bar */}
      <div className="bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#1F2937] -translate-y-1/2 z-0" />
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            return (
              <div 
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className="relative z-10 flex flex-col items-center cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                  isCurrent ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/30 scale-110' :
                  'bg-[#1F2937] text-[#94A3B8] group-hover:text-white'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                </div>
                <span className={`text-[11px] font-semibold mt-1.5 hidden sm:inline ${
                  isCurrent ? 'text-indigo-400' : isCompleted ? 'text-emerald-400' : 'text-[#94A3B8]'
                }`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert if any */}
      {execError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{execError}</span>
        </div>
      )}

      {/* STEP 01: MARKET */}
      {currentStep === 1 && (
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-6">
          <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3">Step 1: Market & Asset Selection</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Strategy Title</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Cryptocurrency Pair</label>
              <select
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setSelectedSymbol(e.target.value);
                }}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="BTC-USD">BTC-USD (Bitcoin)</option>
                <option value="ETH-USD">ETH-USD (Ethereum)</option>
                <option value="SOL-USD">SOL-USD (Solana)</option>
                <option value="BNB-USD">BNB-USD (Binance Coin)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Candle Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="1h">1 Hour (1h)</option>
                <option value="4h">4 Hours (4h)</option>
                <option value="1d">1 Day (1d)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Initial Backtest Capital ($)</label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Exchange Commission Fee (%)</label>
              <input
                type="number"
                step="0.01"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Slippage Simulation (%)</label>
              <input
                type="number"
                step="0.01"
                value={slippagePct}
                onChange={(e) => setSlippagePct(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 02: ENTRY CONDITIONS */}
      {currentStep === 2 && (
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-6">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Step 2: Entry Conditions (BUY Signal)</h3>
              <p className="text-xs text-[#94A3B8]">Construct rule-based criteria required to trigger a Long position</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#94A3B8]">Logic:</span>
              <select
                value={logicOperator}
                onChange={(e) => setLogicOperator(e.target.value)}
                className="bg-[#070B14] border border-[#1F2937] text-xs font-bold text-indigo-400 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value="AND">AND (All Must Match)</option>
                <option value="OR">OR (Any Can Match)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {entryConditions.map((cond, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] flex flex-col md:flex-row items-center gap-3">
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">Rule #{idx + 1}</span>
                
                <select
                  value={cond.indicator}
                  onChange={(e) => handleUpdateCondition('entry', idx, 'indicator', e.target.value)}
                  className="flex-1 bg-[#111827] border border-[#1F2937] text-xs font-semibold text-white rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {availableIndicators.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.label}</option>
                  ))}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdateCondition('entry', idx, 'operator', e.target.value)}
                  className="w-full md:w-44 bg-[#111827] border border-[#1F2937] text-xs font-semibold text-indigo-300 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {availableOperators.map(op => (
                    <option key={op.id} value={op.id}>{op.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => handleUpdateCondition('entry', idx, 'value', e.target.value)}
                  placeholder="Target Value or Indicator (e.g. 30 or ema_50)"
                  className="flex-1 bg-[#111827] border border-[#1F2937] text-xs font-semibold text-white rounded-lg px-3 py-2 focus:outline-none"
                />

                {entryConditions.length > 1 && (
                  <button
                    onClick={() => handleRemoveCondition('entry', idx)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddCondition('entry')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry Rule</span>
          </button>
        </div>
      )}

      {/* STEP 03: EXIT CONDITIONS */}
      {currentStep === 3 && (
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-6">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Step 3: Exit Conditions (SELL Signal)</h3>
              <p className="text-xs text-[#94A3B8]">Specify indicator triggers to close an active position</p>
            </div>
          </div>

          <div className="space-y-3">
            {exitConditions.map((cond, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] flex flex-col md:flex-row items-center gap-3">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">Exit #{idx + 1}</span>
                
                <select
                  value={cond.indicator}
                  onChange={(e) => handleUpdateCondition('exit', idx, 'indicator', e.target.value)}
                  className="flex-1 bg-[#111827] border border-[#1F2937] text-xs font-semibold text-white rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {availableIndicators.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.label}</option>
                  ))}
                </select>

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdateCondition('exit', idx, 'operator', e.target.value)}
                  className="w-full md:w-44 bg-[#111827] border border-[#1F2937] text-xs font-semibold text-emerald-300 rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {availableOperators.map(op => (
                    <option key={op.id} value={op.id}>{op.label}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => handleUpdateCondition('exit', idx, 'value', e.target.value)}
                  placeholder="Target Value or Indicator (e.g. 70)"
                  className="flex-1 bg-[#111827] border border-[#1F2937] text-xs font-semibold text-white rounded-lg px-3 py-2 focus:outline-none"
                />

                {exitConditions.length > 1 && (
                  <button
                    onClick={() => handleRemoveCondition('exit', idx)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handleAddCondition('exit')}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exit Rule</span>
          </button>
        </div>
      )}

      {/* STEP 04: RISK MANAGEMENT */}
      {currentStep === 4 && (
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-6">
          <h3 className="text-base font-bold text-white border-b border-[#1F2937] pb-3">Step 4: Risk & Position Sizing Rules</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Stop Loss (%)</label>
              <input
                type="number"
                step="0.1"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Automatic stop order triggered on loss cap</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Take Profit (%)</label>
              <input
                type="number"
                step="0.1"
                value={takeProfitPct}
                onChange={(e) => setTakeProfitPct(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Target profit exit percentage</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Trailing Stop Loss (%)</label>
              <input
                type="number"
                step="0.1"
                value={trailingStopPct}
                onChange={(e) => setTrailingStopPct(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Dynamic stop trailing peak high price</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Position Size (% of Capital)</label>
              <input
                type="number"
                step="1"
                value={positionSizePct}
                onChange={(e) => setPositionSizePct(e.target.value)}
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
              <p className="text-[10px] text-[#94A3B8] mt-1">Allocation percentage per trade</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 05: REVIEW & EXECUTE */}
      {currentStep === 5 && (
        <div className="terminal-card p-6 rounded-2xl border border-[#1F2937] space-y-6">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <h3 className="text-base font-bold text-white">Step 5: Strategy Review Summary</h3>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold rounded-lg">
              {symbol} ({timeframe})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-2">
              <span className="font-bold text-indigo-400 block mb-2 uppercase tracking-wider text-[10px]">Market Setup</span>
              <p className="text-white"><span className="text-[#94A3B8]">Strategy:</span> {strategyName}</p>
              <p className="text-white"><span className="text-[#94A3B8]">Pair:</span> {symbol}</p>
              <p className="text-white"><span className="text-[#94A3B8]">Timeframe:</span> {timeframe}</p>
              <p className="text-white"><span className="text-[#94A3B8]">Capital:</span> ${parseFloat(initialCapital).toLocaleString()}</p>
            </div>

            <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-2">
              <span className="font-bold text-emerald-400 block mb-2 uppercase tracking-wider text-[10px]">Risk Parameters</span>
              <p className="text-white"><span className="text-[#94A3B8]">Stop Loss:</span> {stopLossPct}%</p>
              <p className="text-white"><span className="text-[#94A3B8]">Take Profit:</span> {takeProfitPct}%</p>
              <p className="text-white"><span className="text-[#94A3B8]">Trailing Stop:</span> {trailingStopPct}%</p>
              <p className="text-white"><span className="text-[#94A3B8]">Position Sizing:</span> {positionSizePct}%</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1F2937] space-y-3 text-xs">
            <div>
              <span className="font-bold text-indigo-400">ENTRY RULES ({logicOperator}):</span>
              <ul className="list-disc list-inside text-white mt-1 space-y-1">
                {entryConditions.map((c, i) => (
                  <li key={i}>{c.indicator} {c.operator} {c.value}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-bold text-emerald-400">EXIT RULES:</span>
              <ul className="list-disc list-inside text-white mt-1 space-y-1">
                {exitConditions.map((c, i) => (
                  <li key={i}>{c.indicator} {c.operator} {c.value}</li>
                ))}
              </ul>
            </div>
          </div>

          <button
            onClick={handleExecuteBacktest}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-base tracking-wide shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.01]"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RUN BACKTEST →</span>
          </button>
        </div>
      )}

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            currentStep === 1 ? 'opacity-40 cursor-not-allowed bg-[#111827] text-[#94A3B8]' : 'bg-[#1F2937] hover:bg-[#374151] text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        {currentStep < 5 && (
          <button
            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* PHASE 6: EXECUTION PROGRESS MODAL */}
      {isExecuting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="terminal-card max-w-md w-full p-6 rounded-2xl border border-indigo-500/40 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-white">Running Backtest Simulation</h3>
              <p className="text-xs text-[#94A3B8] mt-1">Executing bar-by-bar order simulation on {symbol}</p>
            </div>

            <div className="space-y-3 text-xs text-left bg-[#070B14] p-4 rounded-xl border border-[#1F2937]">
              <div className="flex items-center space-x-2.5">
                {execStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-gray-600 animate-spin" />}
                <span className={execStep >= 1 ? 'text-white font-medium' : 'text-[#94A3B8]'}>Loading historical dataset ({symbol})</span>
              </div>
              <div className="flex items-center space-x-2.5">
                {execStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-gray-600 animate-spin" />}
                <span className={execStep >= 2 ? 'text-white font-medium' : 'text-[#94A3B8]'}>Calculating technical indicators</span>
              </div>
              <div className="flex items-center space-x-2.5">
                {execStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-gray-600 animate-spin" />}
                <span className={execStep >= 3 ? 'text-white font-medium' : 'text-[#94A3B8]'}>Simulating trade executions & SL/TP limits</span>
              </div>
              <div className="flex items-center space-x-2.5">
                {execStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-gray-600 animate-spin" />}
                <span className={execStep >= 4 ? 'text-white font-medium' : 'text-[#94A3B8]'}>Computing quantitative analytics & Sharpe ratio</span>
              </div>
              <div className="flex items-center space-x-2.5">
                {execStep >= 5 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <div className="w-4 h-4 rounded-full border border-gray-600 animate-spin" />}
                <span className={execStep >= 5 ? 'text-white font-medium' : 'text-[#94A3B8]'}>Generating Groq AI strategy verdict</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
