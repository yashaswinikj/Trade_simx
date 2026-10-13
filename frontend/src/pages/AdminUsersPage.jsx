import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, ShieldCheck, UserCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.getAdminUsers();
        if (res.success) setUsers(res.users);
      } catch (err) {
        console.error('Error fetching admin users:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B1120] via-[#111827] to-[#070B14] p-6 rounded-2xl border border-[#1F2937] shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>PLATFORM USER MANAGEMENT</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Registered Platform Users</h1>
          <p className="text-xs text-[#94A3B8]">Audit registered trader accounts and security roles stored in MongoDB.</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0B1120] rounded-xl border border-[#1F2937] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Registration Date</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-xs">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#111827]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#94A3B8] font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-extrabold">ADMIN</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-extrabold">USER</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] font-mono">{u.created_at?.split('T')[0]}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">ACTIVE</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#64748B]">
                    No registered users found in database.
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
