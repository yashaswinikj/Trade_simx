import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { ShieldCheck, LayoutDashboard, Mail, Users, Settings, LogOut, Cpu } from 'lucide-react';

export default function AdminShell({ children, onAdminLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await api.getAdminDashboardStats();
        if (res.success && res.stats) {
          setUnreadCount(res.stats.new_messages || 0);
        }
      } catch (err) {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Contact Messages', path: '/admin/messages', icon: Mail, badge: unreadCount },
    { label: 'Registered Users', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#070B14] flex font-sans">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 bg-[#0B1120] border-r border-[#1F2937] flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Admin Header Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-tight block">TradeSimX Admin</span>
              <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider block">Master Control</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                      : 'text-[#94A3B8] hover:bg-[#111827] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white text-purple-600' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer & Logout */}
        <div className="pt-6 border-t border-[#1F2937] space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xs font-bold">
              ADM
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">Administrator</div>
              <div className="text-[10px] text-[#64748B]">admin@tradesimx.ai</div>
            </div>
          </div>

          <button
            onClick={onAdminLogout}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center space-x-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
