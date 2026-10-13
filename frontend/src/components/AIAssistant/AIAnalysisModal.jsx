import React from 'react';
import { X, Sparkles, Bot, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { PLATFORM_CONFIG } from '../../config/platformConfig';

export default function AIAnalysisModal({ isOpen, onClose, title = "AI Quantitative Analysis", analysisData, isLoading, errorMsg }) {
  if (!isOpen) return null;

  const analysisText = analysisData?.analysis || "";
  const timestamp = analysisData?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const modelUsed = analysisData?.model || "Groq LLM";

  // Verdict detection
  let verdictBadge = null;
  if (analysisText.includes("🟢 PROFITABLE") || analysisText.includes("🟢 GOOD") || analysisText.includes("🟢 STRONG")) {
    verdictBadge = { label: "PROFITABLE / STRONG STRATEGY", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 };
  } else if (analysisText.includes("🟡 NEEDS IMPROVEMENT") || analysisText.includes("🟡 MIXED")) {
    verdictBadge = { label: "NEEDS IMPROVEMENT", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle };
  } else if (analysisText.includes("🔴 NOT PROFITABLE") || analysisText.includes("NOT PROFITABLE")) {
    verdictBadge = { label: "NOT PROFITABLE", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldAlert };
  }

  // Parse error message into detailed diagnostic info
  const formatErrorDetail = (msg) => {
    if (!msg) return { main: "AI analysis unavailable", sub: "Please try again later." };
    const lower = msg.toLowerCase();
    if (lower.includes("404") || lower.includes("not found")) {
      if (lower.includes("backtest")) {
        return { main: msg, sub: "The requested backtest document could not be retrieved from MongoDB." };
      }
      return { main: "AI Analysis Route Not Found (404)", sub: "The backend endpoint /api/ai/analyze-backtest was not found." };
    }
    if (lower.includes("groq_model") || lower.includes("model") || lower.includes("decommissioned")) {
      return { main: "Configured Groq Model Unavailable", sub: "The model specified in GROQ_MODEL is invalid or decommissioned. Check backend/.env." };
    }
    if (lower.includes("api_key") || lower.includes("api key") || lower.includes("401") || lower.includes("403")) {
      return { main: "Groq API Key Error", sub: "GROQ_API_KEY is missing or invalid in backend/.env." };
    }
    return { main: msg, sub: "Check backend console logs for additional trace details." };
  };

  const errDetail = errorMsg ? formatErrorDetail(errorMsg) : null;

  // Helper to render markdown line inline styling (bold, bullets, tables)
  const renderInlineFormattedText = (text) => {
    // Split text into paragraphs/lines
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      
      // Skip empty lines or pure divider lines
      if (!trimmed || trimmed.startsWith('===') || trimmed.startsWith('---')) {
        return <div key={lIdx} className="h-2"></div>;
      }

      // Check for bullet lists
      const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
      const cleanLine = isBullet ? trimmed.replace(/^[•\-\*]\s*/, '') : line;

      // Replace bold markdown **text** with <strong>
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const formattedContent = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return <strong key={pIdx} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className="flex items-start space-x-2 my-1 pl-2">
            <span className="text-indigo-400 font-bold">•</span>
            <span className="text-[#CBD5E1] flex-1">{formattedContent}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className="my-1 text-[#CBD5E1] leading-relaxed">
          {formattedContent}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0B1120] border border-[#1F2937] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-[#111827] border-b border-[#1F2937] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">{title}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full flex items-center space-x-1">
                  <Cpu className="w-3 h-3" />
                  <span>{modelUsed}</span>
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">Authoritative Quantitative Intelligence for {PLATFORM_CONFIG.brandName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {timestamp && !isLoading && !errorMsg && (
              <span className="hidden sm:flex items-center space-x-1 text-[11px] text-[#64748B] font-bold bg-[#070B14] px-2.5 py-1 rounded-lg border border-[#1F2937]">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Analysis generated at: {timestamp}</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#94A3B8] hover:text-white bg-[#070B14] hover:bg-[#1F2937] border border-[#1F2937] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-extrabold text-white">Analysing current backtest and TradeSimX strategy...</p>
                <p className="text-xs text-[#94A3B8]">Collecting trade ledger, equity curve, Sharpe ratio, and risk parameters</p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-base font-bold text-red-300">{errDetail.main}</p>
              <p className="text-xs text-[#94A3B8] max-w-lg mx-auto">{errDetail.sub}</p>
            </div>
          ) : (
            <>
              {/* Verdict Banner if detected */}
              {verdictBadge && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${verdictBadge.color}`}>
                  <div className="flex items-center space-x-3">
                    <verdictBadge.icon className="w-6 h-6 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">FINAL VERDICT EVALUATION</span>
                      <span className="text-base font-extrabold">{verdictBadge.label}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#94A3B8] font-bold">Generated at {timestamp}</span>
                </div>
              )}

              {/* Formatted Structured Markdown Content */}
              <div className="space-y-4 font-sans text-xs">
                {analysisText.split(/(?=\n={3,}\n|\n#{1,3}\s)/).map((block, idx) => {
                  const trimmed = block.trim();
                  if (!trimmed) return null;

                  // Section Title Match
                  if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
                    const headingText = trimmed.split('\n')[0].replace(/^#+\s*/, '');
                    const restOfContent = trimmed.split('\n').slice(1).join('\n');

                    return (
                      <div key={idx} className="bg-[#070B14]/80 border border-[#1F2937] rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-[#111827] px-4 py-3 border-b border-[#1F2937] flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                          <h3 className="text-sm font-extrabold text-white tracking-wide">{headingText}</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          {renderInlineFormattedText(restOfContent)}
                        </div>
                      </div>
                    );
                  }

                  // Standard Content Block
                  return (
                    <div key={idx} className="bg-[#070B14]/60 border border-[#1F2937] p-4 rounded-xl">
                      {renderInlineFormattedText(trimmed)}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#111827] border-t border-[#1F2937] flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-[#64748B]">TradeSimX Quantitative Research Engine • Educational Simulation Platform</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#6366F1] hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            Close Analysis
          </button>
        </div>

      </div>
    </div>
  );
}
