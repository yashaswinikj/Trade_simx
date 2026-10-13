import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Cpu, LogIn, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setErrorMsg('Please enter your email.');
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(cleanEmail, cleanPassword);
      if (res.success && res.user && res.user.token) {
        localStorage.setItem('tradesimx_token', res.user.token);
        localStorage.setItem('tradesimx_user', JSON.stringify(res.user));
        if (onLoginSuccess) onLoginSuccess(res.user);
        navigate('/dashboard');
      } else {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err?.response?.status === 401) {
        setErrorMsg('Invalid email or password.');
      } else if (err?.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex font-sans">
      {/* Left Split */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#070B14] p-12 flex-col justify-between border-r border-[#1F2937] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none" />
        
        <Link to="/" className="flex items-center space-x-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">TradeSimX AI</span>
        </Link>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>QUANTITATIVE TRADING TERMINAL</span>
          </div>

          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Build Strategies. Backtest Markets. Predict Signals with AI.
          </h2>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Access your algorithmic trading workspace to run bar-by-bar backtest simulations, train XGBoost classifiers, and analyze metrics with AI.
          </p>
        </div>

        <p className="text-[11px] text-[#64748B] relative z-10">
          © {new Date().getFullYear()} TradeSimX AI Research Platform.
        </p>
      </div>

      {/* Right Split: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center lg:text-left">
            <Link to="/" className="lg:hidden inline-flex items-center space-x-2 mb-6">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <span className="font-bold text-lg text-white">TradeSimX AI</span>
            </Link>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In to TradeSimX</h1>
            <p className="text-xs text-[#94A3B8] mt-1">Enter your registered email and password to access protected pages.</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#0B1120] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B1120] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{loading ? 'Verifying Password...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-400 hover:underline">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
