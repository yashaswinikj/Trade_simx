import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-[#04070D] border-t border-[#1F2937] text-[#94A3B8] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Column 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">TradeSimX AI</span>
            </Link>
            <p className="text-xs text-[#94A3B8] max-w-sm leading-relaxed">
              An educational and research platform for algorithmic cryptocurrency trading, machine learning model validation, and AI-assisted quantitative backtesting.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Quantitative Risk Engine & Real Calculations</span>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Product Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Strategy Builder</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Historical Backtests</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">ML Predictions</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">AI Analyst</Link></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="hover:text-white transition-colors">About TradeSimX</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/features" className="hover:text-white transition-colors">All Features</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Column 4: Legal & Resources */}
          <div>
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">Legal & Terms</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1F2937]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B]">
          <p>© {new Date().getFullYear()} TradeSimX AI Platform. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Built with Python, React, XGBoost, and Groq AI.</p>
        </div>
      </div>
    </footer>
  );
}
