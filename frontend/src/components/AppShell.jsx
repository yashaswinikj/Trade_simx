import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatbot from './AIAssistant/AIChatbot';
import { api } from '../services/api';

export default function AppShell({ children, user, onLogout }) {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [floatingChatOpen, setFloatingChatOpen] = useState(false);
  const [aiContext, setAiContext] = useState({});

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Verify auth token or demo access
    const token = localStorage.getItem('tradesimx_token');
    if (!token && location.pathname !== '/login' && location.pathname !== '/register') {
      // Auto assign demo token for smooth demo experience
      localStorage.setItem('tradesimx_token', 'demo_token_101');
    }

    // Check Backend Health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data))
      .catch(err => console.error(err));
  }, [location.pathname]);

  const mapPathToTab = (path) => {
    if (path.startsWith('/strategy-builder')) return 'builder';
    if (path.startsWith('/backtests')) return 'backtests';
    if (path.startsWith('/ml-predictions')) return 'ml-predictions';
    if (path.startsWith('/strategy-comparison')) return 'comparison';
    if (path.startsWith('/reports')) return 'reports';
    if (path.startsWith('/settings')) return 'settings';
    if (path.startsWith('/ai-assistant')) return 'ai-analyst';
    return 'dashboard';
  };

  const handleTabChange = (tabId) => {
    switch (tabId) {
      case 'dashboard': navigate('/dashboard'); break;
      case 'builder': navigate('/strategy-builder'); break;
      case 'backtests': navigate('/backtests'); break;
      case 'ml-predictions': navigate('/ml-predictions'); break;
      case 'comparison': navigate('/strategy-comparison'); break;
      case 'reports': navigate('/reports'); break;
      case 'settings': navigate('/settings'); break;
      case 'ai-analyst': navigate('/ai-assistant'); break;
      default: navigate('/dashboard');
    }
  };

  const activeTab = mapPathToTab(location.pathname);

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
        onLogout={onLogout}
      />

      {/* Main App Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar
          setMobileOpen={setMobileOpen}
          activeTab={activeTab}
          selectedSymbol={selectedSymbol}
          setSelectedSymbol={setSelectedSymbol}
          onOpenChat={() => setFloatingChatOpen(true)}
          backendStatus={backendStatus}
        />

        {/* Dynamic Page Component */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating AI Assistant Drawer Accessible Everywhere */}
      {floatingChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <AIChatbot
            activeContext={aiContext}
            isFloating={true}
            onClose={() => setFloatingChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
