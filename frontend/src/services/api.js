import axios from 'axios';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token if saved
client.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('tradesimx_admin_token');
  const token = localStorage.getItem('tradesimx_token');
  if (config.url?.startsWith('/admin') && adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Data
  getSymbols: async () => {
    const res = await client.get('/data/symbols');
    return res.data;
  },

  getOHLCV: async (symbol = 'BTC-USD', timeframe = '1h', limit = 1000) => {
    const res = await client.get(`/data/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
    return res.data;
  },

  calculateIndicators: async (symbol, timeframe, config) => {
    const res = await client.post('/indicators/calculate', { symbol, timeframe, config });
    return res.data;
  },

  // ML
  getDatasetInfo: async () => {
    const res = await client.get('/ml/dataset-info');
    return res.data;
  },

  getModelInfo: async () => {
    const res = await client.get('/ml/model-info');
    return res.data;
  },

  getFeatureImportance: async () => {
    const res = await client.get('/ml/feature-importance');
    return res.data;
  },

  trainMLModel: async (symbol = 'BTC-USD', algorithm = 'xgboost', name = '') => {
    const res = await client.post('/ml/train', { symbol, algorithm, name });
    return res.data;
  },

  predictMLSignal: async (symbol = 'BTC-USD', modelId = null) => {
    const res = await client.post('/ml/predict', { symbol, model_id: modelId });
    return res.data;
  },

  getMLModels: async () => {
    const res = await client.get('/ml/models');
    return res.data;
  },

  // Contact Us
  submitContact: async (name, email, subject, message) => {
    const res = await client.post('/contact', { name, email, subject, message });
    return res.data;
  },

  // Admin Portal & Management
  adminLogin: async (email = '', password = '') => {
    const res = await client.post('/admin/login', { email, password });
    if (res.data.success && res.data.user?.token) {
      localStorage.setItem('tradesimx_admin_token', res.data.user.token);
      localStorage.setItem('tradesimx_admin_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getAdminDashboardStats: async () => {
    const res = await client.get('/admin/dashboard/stats');
    return res.data;
  },

  getAdminMessages: async (statusFilter = 'all', searchQuery = '', sortOrder = 'newest') => {
    const res = await client.get(`/admin/messages?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}&sort=${sortOrder}`);
    return res.data;
  },

  getAdminMessageDetail: async (msgId) => {
    const res = await client.get(`/admin/messages/${msgId}`);
    return res.data;
  },

  replyAdminMessage: async (msgId, replyMessage) => {
    const res = await client.post(`/admin/messages/${msgId}/reply`, { reply_message: replyMessage });
    return res.data;
  },

  deleteAdminMessage: async (msgId) => {
    const res = await client.delete(`/admin/messages/${msgId}`);
    return res.data;
  },

  getAdminUsers: async () => {
    const res = await client.get('/admin/users');
    return res.data;
  },

  // Strategies
  getStrategies: async () => {
    const res = await client.get('/strategies');
    return res.data;
  },

  saveStrategy: async (strategyData) => {
    const res = await client.post('/strategies', strategyData);
    return res.data;
  },

  deleteStrategy: async (id) => {
    const res = await client.delete(`/strategies/${id}`);
    return res.data;
  },

  // Backtest
  runBacktest: async (params) => {
    const res = await client.post('/backtest/run', params);
    return res.data;
  },

  getBacktestHistory: async () => {
    const res = await client.get('/backtest/history');
    return res.data;
  },

  getBacktestResult: async (id) => {
    const res = await client.get(`/backtest/result/${id}`);
    return res.data;
  },

  // AI Service
  checkAIHealth: async () => {
    const res = await client.get('/ai/health');
    return res.data;
  },

  testAI: async (message = 'Say hello in one short sentence.') => {
    const res = await client.post('/ai/test', { message });
    return res.data;
  },

  analyzeBacktestAI: async (backtestId) => {
    const res = await client.post('/ai/analyze-backtest', { backtest_id: backtestId });
    return res.data;
  },

  analyzeMarketAI: async (symbol = 'BTC-USD', context = null) => {
    const res = await client.post('/ai/analyze', { symbol, context });
    return res.data;
  },

  analyzeStrategyAI: async (strategy, metrics) => {
    const res = await client.post('/ai/analyze', { context: { strategy, metrics } });
    return res.data;
  },

  generateStrategyFromAI: async (prompt) => {
    const res = await client.post('/ai/generate-strategy', { prompt });
    return res.data;
  },

  chatAI: async (message, conversation = [], symbol = 'BTC-USD') => {
    const res = await client.post('/ai/chat', {
      message,
      conversation,
      symbol
    });
    return res.data;
  },

  // Export Reports
  downloadPDFReport: async (backtestResult, strategyName, symbol) => {
    const res = await client.post('/report/generate-pdf', {
      backtest_result: backtestResult,
      strategy_name: strategyName,
      symbol: symbol
    }, { responseType: 'blob' });
    
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tradesimx_report_${backtestResult.id || 'export'}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadCSVReport: async (backtestResult) => {
    const res = await client.post('/report/generate-csv', {
      backtest_result: backtestResult
    }, { responseType: 'blob' });
    
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tradesimx_trades_${backtestResult.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Auth
  login: async (email = '', password = '') => {
    const res = await client.post('/auth/login', { email, password });
    if (res.data.success && res.data.user?.token) {
      localStorage.setItem('tradesimx_token', res.data.user.token);
      localStorage.setItem('tradesimx_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  register: async (name, email, password, confirmPassword) => {
    const res = await client.post('/auth/register', { name, email, password, confirmPassword });
    if (res.data.success && res.data.user?.token) {
      localStorage.setItem('tradesimx_token', res.data.user.token);
      localStorage.setItem('tradesimx_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getProfile: async () => {
    const res = await client.get('/auth/me');
    return res.data;
  },

  // Quant Engine Extensions
  detectRegime: async (symbol = 'BTC-USD') => {
    const res = await client.get(`/regime/detect?symbol=${symbol}`);
    return res.data;
  },

  runOptimization: async (symbol = 'BTC-USD') => {
    const res = await client.post('/optimization/run', { symbol });
    return res.data;
  },

  runWalkForward: async (symbol = 'BTC-USD') => {
    const res = await client.post('/optimization/walk-forward', { symbol });
    return res.data;
  },

  getRiskAnalytics: async (symbol = 'BTC-USD', capital = 10000, positionSizePct = 25, stopLossPct = 2.5) => {
    const res = await client.get(`/risk/analytics?symbol=${symbol}&capital=${capital}&position_size_pct=${positionSizePct}&stop_loss_pct=${stopLossPct}`);
    return res.data;
  },

  getPortfolioSummary: async () => {
    const res = await client.get('/portfolio/summary');
    return res.data;
  },

  getPaperSummary: async () => {
    const res = await client.get('/paper-trading/summary');
    return res.data;
  },

  buyPaper: async (symbol = 'BTC-USD', amount = 0.1, price = 94580.0) => {
    const res = await client.post('/paper-trading/buy', { symbol, amount, price });
    return res.data;
  },

  sellPaper: async (symbol = 'BTC-USD', amount = 0.1, price = 94580.0) => {
    const res = await client.post('/paper-trading/sell', { symbol, amount, price });
    return res.data;
  },

  executePaperOrder: async (symbol = 'BTC-USD', side = 'BUY', amount = 0.1, price = 94580.0) => {
    const endpoint = side.toUpperCase() === 'SELL' ? '/paper-trading/sell' : '/paper-trading/buy';
    const res = await client.post(endpoint, { symbol, amount, price });
    return res.data;
  },

  checkOverfitting: async (symbol = 'BTC-USD') => {
    const res = await client.get(`/overfitting/check?symbol=${symbol}`);
    return res.data;
  },

  critiqueStrategy: async (strategy, metrics = null) => {
    const res = await client.post('/ai/critique', { strategy, metrics });
    return res.data;
  }
};
