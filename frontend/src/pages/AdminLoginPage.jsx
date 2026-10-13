import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage({ onAdminLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin(cleanEmail, cleanPassword);
      if (res.success && res.user && res.user.role === 'admin') {
        localStorage.setItem('tradesimx_admin_token', res.user.token);
        localStorage.setItem('tradesimx_admin_user', JSON.stringify(res.user));
        if (onAdminLoginSuccess) onAdminLoginSuccess(res.user);
        navigate('/admin/dashboard');
      } else {
        setErrorMsg(res.error || 'Invalid administrator credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setErrorMsg('Invalid administrator credentials.');
      } else if (err?.response?.data?.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Unable to connect to authentication server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-transparent to-indigo-950/20 pointer-events-none" />

      <div className="max-w-md w-full bg-[#0B1120] border border-[#1F2937] p-8 rounded-2xl shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">TradeSimX Admin Gateway</h1>
          <p className="text-xs text-[#94A3B8]">Restricted Portal. Authorized Administrator Access Only.</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tradesimx.ai"
              className="w-full bg-[#070B14] border border-[#1F2937] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Admin Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#070B14] border border-[#1F2937] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Verifying Admin Hash...' : 'Authenticate Admin Session'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-[#64748B]">
          © {new Date().getFullYear()} TradeSimX AI Admin Control System
        </div>
      </div>
    </div>
  );
}
