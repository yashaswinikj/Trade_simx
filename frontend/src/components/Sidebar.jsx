import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Workflow, 
  LineChart, 
  BrainCircuit, 
  GitCompare, 
  Bot, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  X,
  TrendingUp,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Briefcase,
  BookOpen,
  PieChart,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/market', label: 'Market Analysis', icon: TrendingUp },
    { path: '/strategy-builder', label: 'Strategy Builder', icon: Workflow },
    { path: '/backtesting', label: 'Backtests Engine', icon: LineChart },
    { path: '/prediction', label: 'AI Predictions', icon: BrainCircuit, badge: 'AI' },
    { path: '/model-lab', label: 'ML Model Lab', icon: Cpu, badge: 'LSTM' },
    { path: '/market-regime', label: 'Market Regime', icon: Layers },
    { path: '/optimization', label: 'Optimization Lab', icon: Zap },
    { path: '/risk', label: 'Risk Analytics', icon: ShieldCheck },
    { path: '/portfolio', label: 'Portfolio Tracker', icon: PieChart },
    { path: '/paper-trading', label: 'Paper Trading', icon: Briefcase, badge: 'Live' },
    { path: '/overfitting', label: 'Overfitting Defense', icon: BookOpen },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'Groq' },
    { path: '/reports', label: 'Reports Hub', icon: FileSpreadsheet },
    { path: '/profile', label: 'User Profile', icon: UserCheck }
  ];

  const handleNav = (path) => {
    navigate(path);
    if (mobileOpen) setMobileOpen(false);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#0B1120] border-r border-[#1F2937] text-[#F8FAFC]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNav('/dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">TradeSimX</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-md">AI</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] font-medium">Quant Research SaaS</p>
          </div>
        </div>
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1F2937] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Research Platform</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/20 font-bold'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#111827]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#1F2937] bg-[#070B14]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNav('/profile')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xs border border-indigo-400/30">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'TR'}
            </div>
            <div className="truncate max-w-[110px]">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Trader Account'}</p>
              <p className="text-[10px] text-emerald-400 font-medium flex items-center">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse"></span>
                Pro Quant
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-1.5 text-[#94A3B8] hover:text-red-400 hover:bg-[#111827] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 z-30">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex-1 max-w-xs w-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
