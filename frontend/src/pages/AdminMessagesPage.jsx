import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Mail, Search, Filter, Trash2, Send, CheckCircle2, AlertCircle, X, MessageSquare, Clock } from 'lucide-react';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, [statusFilter, sortOrder]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMessages(statusFilter, searchQuery, sortOrder);
      if (res.success) setMessages(res.messages);
    } catch (err) {
      console.error('Error fetching admin messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMessages();
  };

  const handleOpenDetail = async (msgId) => {
    try {
      const res = await api.getAdminMessageDetail(msgId);
      if (res.success) {
        setSelectedMsg(res.message);
        setReplyText(res.message.admin_reply || '');
        setFeedback(null);
        fetchMessages();
      }
    } catch (err) {
      console.error('Error getting message detail:', err);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    setFeedback(null);
    try {
      const res = await api.replyAdminMessage(selectedMsg.id, replyText.trim());
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setSelectedMsg({
          ...selectedMsg,
          status: 'replied',
          admin_reply: replyText.trim(),
          replied_at: res.replied_at
        });
        fetchMessages();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to save reply.' });
      }
    } catch (err) {
      console.error('Error replying to message:', err);
      setFeedback({ type: 'error', text: 'Error submitting reply.' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this contact message?')) return;

    try {
      const res = await api.deleteAdminMessage(msgId);
      if (res.success) {
        setSelectedMsg(null);
        fetchMessages();
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0B1120] via-[#111827] to-[#070B14] p-6 rounded-2xl border border-[#1F2937] shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>CONTACT US MANAGEMENT TERMINAL</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Contact Messages & Replies</h1>
          <p className="text-xs text-[#94A3B8]">Review user inquiries, inspect details, mark status, and send responses.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0B1120] p-4 rounded-xl border border-[#1F2937]">
        {/* Status Filter Tabs */}
        <div className="flex space-x-1.5 overflow-x-auto w-full md:w-auto">
          {['all', 'new', 'read', 'replied'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                statusFilter === f
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-[#94A3B8] hover:bg-[#111827] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, subject..."
              className="w-full bg-[#070B14] border border-[#1F2937] focus:border-purple-500 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
          </form>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-[#070B14] border border-[#1F2937] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-[#0B1120] rounded-xl border border-[#1F2937] p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2937] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="py-3 px-4">From Name</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Received Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937] text-xs">
              {messages.length > 0 ? (
                messages.map((m) => (
                  <tr key={m.id} className="hover:bg-[#111827]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{m.name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{m.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#94A3B8] max-w-sm truncate">{m.subject}</td>
                    <td className="py-3.5 px-4 text-[#64748B] font-mono">{m.created_at?.replace('T', ' ')?.split('.')[0]}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(m.status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenDetail(m.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold"
                      >
                        Inspect / Reply
                      </button>

                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#64748B]">
                    No contact messages found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Inspection & Reply Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B1120] border border-[#1F2937] rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">From: {selectedMsg.name}</span>
                  {getStatusBadge(selectedMsg.status)}
                </div>
                <div className="text-xs text-[#94A3B8] font-mono">Email: {selectedMsg.email}</div>
              </div>

              <button
                onClick={() => setSelectedMsg(null)}
                className="p-2 rounded-xl text-[#64748B] hover:text-white hover:bg-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subject & Original Message Body */}
            <div className="space-y-3 bg-[#070B14] p-4 rounded-xl border border-[#1F2937]">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase block">Subject:</span>
                <span className="text-sm font-extrabold text-white">{selectedMsg.subject}</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase block mb-1">Message Body:</span>
                <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{selectedMsg.message}</p>
              </div>

              <div className="text-[10px] text-[#64748B] pt-2 border-t border-[#1F2937] flex justify-between">
                <span>Received: {selectedMsg.created_at}</span>
                {selectedMsg.user_id && <span>User ID: {selectedMsg.user_id}</span>}
              </div>
            </div>

            {/* Previous Admin Reply Display if Present */}
            {selectedMsg.admin_reply && (
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                <div className="text-[11px] font-bold text-purple-400 uppercase flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Admin Reply Sent ({selectedMsg.replied_at}):</span>
                </div>
                <p className="text-xs text-white leading-relaxed whitespace-pre-wrap">{selectedMsg.admin_reply}</p>
              </div>
            )}

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">Reply Message</label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official support response here..."
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {feedback && (
                <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                  feedback.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(selectedMsg.id)}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Inquiry</span>
                </button>

                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center space-x-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Saving Reply...' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
