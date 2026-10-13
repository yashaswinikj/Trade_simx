import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import FeaturesPage from './pages/FeaturesPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PreventingOverfittingPage from './pages/PreventingOverfittingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// Protected Application Pages & Components
import AppShell from './components/AppShell';
import Dashboard from './components/Dashboard/Dashboard';
import MarketPage from './pages/MarketPage';
import StrategyBuilder from './components/StrategyBuilder/StrategyBuilder';
import BacktestResults from './components/Backtest/BacktestResults';
import MLPredictions from './components/MLStudio/MLPredictions';
import ModelLabPage from './pages/ModelLabPage';
import MarketRegimePage from './pages/MarketRegimePage';
import OptimizationPage from './pages/OptimizationPage';
import RiskAnalyticsPage from './pages/RiskAnalyticsPage';
import PortfolioPage from './pages/PortfolioPage';
import PaperTradingPage from './pages/PaperTradingPage';
import StrategyComparison from './components/StrategyComparison/StrategyComparison';
import ReportsPage from './components/Reports/ReportsPage';
import SettingsPage from './components/Settings/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AIChatbot from './components/AIAssistant/AIChatbot';
import DatasetInfoPage from './pages/DatasetInfoPage';

// Admin Portal Pages & Shell
import AdminLoginPage from './pages/AdminLoginPage';
import AdminShell from './components/Admin/AdminShell';
import AdminDashboard from './pages/AdminDashboard';
import AdminMessagesPage from './pages/AdminMessagesPage';
import AdminUsersPage from './pages/AdminUsersPage';

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('tradesimx_user');
    const token = localStorage.getItem('tradesimx_token');
    if (saved && token) return JSON.parse(saved);
  } catch (e) {}
  return null;
};

const getInitialAdminUser = () => {
  try {
    const saved = localStorage.getItem('tradesimx_admin_user');
    const token = localStorage.getItem('tradesimx_admin_token');
    if (saved && token) {
      const userObj = JSON.parse(saved);
      if (userObj.role === 'admin') return userObj;
    }
  } catch (e) {}
  return null;
};

function ProtectedRoute({ user, children }) {
  const token = localStorage.getItem('tradesimx_token');
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminProtectedRoute({ adminUser, children }) {
  const token = localStorage.getItem('tradesimx_admin_token');
  if (!adminUser || !token || adminUser.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function BacktestDetailsWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <BacktestResults
      backtestId={id || 'test_run_123'}
      onOpenAIChatWithContext={(ctx) => console.log(ctx)}
      onBackToHistory={() => navigate('/backtesting')}
    />
  );
}

export default function App() {
  const [user, setUser] = useState(getInitialUser());
  const [adminUser, setAdminUser] = useState(getInitialAdminUser());
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');

  const handleLoginSuccess = (userData) => {
    if (userData && userData.token) {
      localStorage.setItem('tradesimx_token', userData.token);
      localStorage.setItem('tradesimx_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const handleAdminLoginSuccess = (adminData) => {
    if (adminData && adminData.token) {
      localStorage.setItem('tradesimx_admin_token', adminData.token);
      localStorage.setItem('tradesimx_admin_user', JSON.stringify(adminData));
      setAdminUser(adminData);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tradesimx_token');
    localStorage.removeItem('tradesimx_user');
    setUser(null);
    window.location.href = '/login';
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('tradesimx_admin_token');
    localStorage.removeItem('tradesimx_admin_user');
    setAdminUser(null);
    window.location.href = '/admin/login';
  };

  return (
    <Router>
      <Routes>
        {/* Public Website Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/preventing-overfitting" element={<PreventingOverfittingPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        {/* Auth Gateway Routes */}
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<RegisterPage onLoginSuccess={handleLoginSuccess} />} />

        {/* Dedicated Admin Login Gateway */}
        <Route path="/admin/login" element={<AdminLoginPage onAdminLoginSuccess={handleAdminLoginSuccess} />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute adminUser={adminUser}>
              <AdminShell onAdminLogout={handleAdminLogout}>
                <AdminDashboard />
              </AdminShell>
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <AdminProtectedRoute adminUser={adminUser}>
              <AdminShell onAdminLogout={handleAdminLogout}>
                <AdminMessagesPage />
              </AdminShell>
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute adminUser={adminUser}>
              <AdminShell onAdminLogout={handleAdminLogout}>
                <AdminUsersPage />
              </AdminShell>
            </AdminProtectedRoute>
          }
        />

        {/* Protected User Application Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <Dashboard setSelectedSymbol={setSelectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/market"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <MarketPage selectedSymbol={selectedSymbol} setSelectedSymbol={setSelectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dataset-info"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <DatasetInfoPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/strategy-builder"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <StrategyBuilder
                  selectedSymbol={selectedSymbol}
                  setSelectedSymbol={setSelectedSymbol}
                  onBacktestComplete={(id) => window.location.href = `/backtests/${id}`}
                />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/strategies" element={<Navigate to="/strategy-builder" replace />} />

        <Route
          path="/backtesting"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <BacktestResults
                  backtestId="test_run_123"
                  onOpenAIChatWithContext={(ctx) => console.log(ctx)}
                  onBackToHistory={() => {}}
                />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/backtests" element={<Navigate to="/backtesting" replace />} />
        <Route
          path="/backtests/:id"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <BacktestDetailsWrapper />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/prediction"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <MLPredictions selectedSymbol={selectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/ml-predictions" element={<Navigate to="/prediction" replace />} />

        <Route
          path="/model-lab"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <ModelLabPage selectedSymbol={selectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/market-regime"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <MarketRegimePage selectedSymbol={selectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/optimization"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <OptimizationPage selectedSymbol={selectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/optimization-lab" element={<Navigate to="/optimization" replace />} />

        <Route
          path="/risk"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <RiskAnalyticsPage selectedSymbol={selectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="/risk-analytics" element={<Navigate to="/risk" replace />} />

        <Route
          path="/portfolio"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <PortfolioPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/paper-trading"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <PaperTradingPage selectedSymbol={selectedSymbol} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/overfitting"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <PreventingOverfittingPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/strategy-comparison"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <StrategyComparison />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <ReportsPage
                  onSelectBacktestResult={(id) => window.location.href = `/backtests/${id}`}
                  onOpenAIChatWithContext={(ctx) => console.log(ctx)}
                />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <ProfilePage user={user} onLogout={handleLogout} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <SettingsPage user={user} />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant"
          element={
            <ProtectedRoute user={user}>
              <AppShell user={user} onLogout={handleLogout}>
                <AIChatbot />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
