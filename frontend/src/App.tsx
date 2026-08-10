import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { ScanConfiguration } from './pages/ScanConfiguration';
import { ScanProgress } from './pages/ScanProgress';
import { ScanResults } from './pages/ScanResults';
import { Team } from './pages/Team';
import { NotFound } from './pages/NotFound';
import { RemediationPage } from './pages/RemediationPage';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { authApi } from './services/apiClient';
import { Footer } from './components/layout/Footer';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  return authApi.isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  React.useEffect(() => {
    localStorage.removeItem('theme');
    document.body.classList.remove('light');
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-dark-900 flex flex-col">
        {authApi.isAuthenticated() ? <Header /> : null}
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanConfiguration /></ProtectedRoute>} />
            <Route path="/scan/progress/:scanId" element={<ProtectedRoute><ScanProgress /></ProtectedRoute>} />
            <Route path="/progress/:scanId" element={<ProtectedRoute><ScanProgress /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><ScanResults /></ProtectedRoute>} />
            <Route path="/results/:scanId" element={<ProtectedRoute><ScanResults /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
            <Route path="/remediation" element={<ProtectedRoute><RemediationPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Navigate to="/results" replace /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {authApi.isAuthenticated() ? <Footer /> : null}
      </div>
    </BrowserRouter>
  );
}

export default App;