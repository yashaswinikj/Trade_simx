import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Cpu, Menu, X, ArrowRight, LogIn } from 'lucide-react';

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/features', label: 'Features' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#070B14]/85 backdrop-blur-md border-b border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">TradeSimX</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">AI</span>
            </div>
            <span className="text-[10px] text-[#94A3B8] font-medium block -mt-0.5">Quant Trading Platform</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/login"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:bg-[#111827] border border-transparent hover:border-[#1F2937] transition-all"
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            <span>Login</span>
          </Link>
          <Link
            to="/register"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl bg-[#111827] border border-[#1F2937] text-[#94A3B8] hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0B1120] border-b border-[#1F2937] px-4 pt-3 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#94A3B8] hover:text-white hover:bg-[#111827]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#1F2937] flex flex-col gap-2">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 text-center rounded-xl bg-[#111827] border border-[#1F2937] text-white text-xs font-bold"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="w-full py-2.5 text-center rounded-xl bg-[#6366F1] text-white text-xs font-extrabold"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
