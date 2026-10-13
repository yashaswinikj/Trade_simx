import React, { useState } from 'react';
import { api } from '../services/api';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!name.trim() || !subject.trim() || !message.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitContact(name.trim(), cleanEmail, subject.trim(), message.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'Message sent successfully! Our team will review your message and get back to you.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setErrorMsg(res.error || 'Unable to send your message right now. Please try again.');
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      const msg = err?.response?.data?.error || 'Unable to send your message right now. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] font-sans flex flex-col justify-between">
      <PublicNavbar />

      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        {/* Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>TRADE SIM X RESEARCH SUPPORT</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact Our Platform Team</h1>
          <p className="text-xs text-[#94A3B8] max-w-lg mx-auto">
            Have questions regarding algorithmic backtesting, machine learning models, or paper trading simulations? Send us a message below.
          </p>
        </div>

        {/* Contact Form Container */}
        <div className="bg-[#0B1120] border border-[#1F2937] p-8 rounded-2xl shadow-xl space-y-6">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@gmail.com"
                  className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Question regarding paper trading or ML model validation"
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please write your query here..."
                className="w-full bg-[#070B14] border border-[#1F2937] focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending Message...' : 'Submit Contact Message'}</span>
            </button>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
