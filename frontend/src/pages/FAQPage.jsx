import React, { useState } from 'react';
import PublicNavbar from '../components/Public/PublicNavbar';
import PublicFooter from '../components/Public/PublicFooter';
import { PLATFORM_CONFIG } from '../config/platformConfig';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "What is TradeSimX?",
      a: `${PLATFORM_CONFIG.title}. It allows traders, quantitative researchers, and students to build no-code strategies, test them against historical market data, train ML models, and converse with an AI analyst.`
    },
    {
      q: "Does TradeSimX execute real-money trades or provide financial advice?",
      a: "No. TradeSimX is purely an educational, research, and paper-trading simulation system. It does NOT connect to real broker bank accounts or execute live real-money orders."
    },
    {
      q: "What Machine Learning & AI models are integrated?",
      a: "TradeSimX integrates Random Forest Classifiers, XGBoost, LightGBM, Deep Learning LSTM Sequence Neural Networks, SHAP Explainability feature contributions, and Groq API LLM (Llama 3.3 70B)."
    },
    {
      q: "What is Market Regime Detection?",
      a: "Market Regime Detection is a mathematical classifier that identifies whether the asset is in a Bull Trend, Bear Trend, Sideways Consolidation, High Volatility, or Low Volatility phase."
    },
    {
      q: "What is Walk-Forward Validation?",
      a: "Walk-Forward Validation tests strategies on sequential, unseen out-of-sample historical rolling windows to prove that performance is stable and not overfitted to past data."
    },
    {
      q: "How does the Paper Trading Simulator work?",
      a: "Users start with a virtual capital balance of ₹10,00,000 / $100,000 to place simulated BUY/SELL market orders, track mark-to-market unrealized PnL, and manage open positions."
    }
  ];

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
            KNOWLEDGE BASE
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h1>
          <p className="text-sm text-[#94A3B8]">Learn about TradeSimX architecture, algorithms, and features.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="terminal-card rounded-2xl border border-[#1F2937] overflow-hidden">
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-white text-sm hover:bg-[#111827] transition-colors"
                >
                  <span className="flex items-center space-x-3">
                    <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-[#64748B]" />}
                </button>

                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-[#94A3B8] leading-relaxed border-t border-[#1F2937]/50 bg-[#070B14]/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
