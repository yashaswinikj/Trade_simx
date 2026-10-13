import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, MessageSquare, CheckCircle2, Users, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentMsgs, setRecentMsgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminDashboard() {
      try {
        const [statsRes, msgsRes] = await Promise.all([
          api.getAdminDashboardStats(),
          api.getAdminMessages('all', '', 'newest')
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (msgsRes.success) setRecentMsgs(msgsRes.messages.slice(0, 5));
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminDashboard();
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'new') {
      return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-extrabold">NEW</span>;
    } else if (status === 'replied') {
      return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold">REPLIED</span>;
    } else {
      return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold">READ</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B1120] via-[#111827] to-[#070B14] p-6 rounded-2xl border border-[#1F2937] shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TRADE SIM X MASTER CONTROL PANEL</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Administrator Overview</h1>
          <p className="text-xs text-[#94A3B8]">Monitor contact inquiries, manage user accounts, and dispatch support responses.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1120] p-4 rounded-xl border border-[#1F2937] space-y-1">
          <div className="text-xs font-semibold text-[#94A3B8] flex items-center space-x-1.5">
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Total Messages</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.total_messages || 0}</div>
          <div className="text-[11px] text-[#64748B]">All Submitted Queries</div>
        </div>

        <div className="bg-[#0B1120] p-4 rounded-xl border border-[#1F2937] space-y-1">
          <div className="text-xs font-semibold text-[#94A3B8] flex items-center space-x-1.5">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>New Unread Messages</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-400">{stats?.new_messages || 0}</div>
          <div className="text-[11px] text-purple-400 font-semibold">Action Required</div>
        </div>

        <div className="bg-[#0B1120] p-4 rounded-xl border border-[#1F2937] space-y-1">
          <div className="text-xs font-semibold text-[#94A3B8] flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Replied Messages</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{stats?.replied_messages || 0}</div>
          <div className="text-[11px] text-[#64748B]">Completed Responses</div>
        </div>

        <div className="bg-[#0B1120] p-4 rounded-xl border border-[#1F2937] space-y-1">
          <div className="text-xs font-semibold text-[#94A3B8] flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Registered Users</span>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.registered_users || 0}</div>
          <div className="text-[11px] text-[#64748B]">Normal Accounts</div>
        </div>
      </div>

      {/* Recent Contact Messages */}
      <div className="bg-[#0B1120] rounded-xl border border-[#1F2937] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Recent Contact Inquiries</span>
          </h3>

          <Link
            to="/admin/messages"
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center space-x-1"
          >
            <span>View All Messages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">From Name</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-xs">
              {recentMsgs.length > 0 ? (
                recentMsgs.map((m) => (
                  <tr key={m.id} className="hover:bg-[#111827]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{m.name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{m.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#94A3B8] max-w-xs truncate">{m.subject}</td>
                    <td className="py-3.5 px-4 text-[#64748B] font-mono">{m.created_at?.split('T')[0]}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(m.status)}</td>
                    <td className="py-3.5 px-4">
                      <Link
                        to="/admin/messages"
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold"
                      >
                        Inspect & Reply
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                    No contact messages submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
