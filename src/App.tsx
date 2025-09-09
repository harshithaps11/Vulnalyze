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

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-900 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<ScanConfiguration />} />
            <Route path="/scan/progress/:scanId" element={<ScanProgress />} />
            <Route path="/results" element={<ScanResults />} />
            <Route path="/team" element={<Team />} />
            <Route path="/remediation" element={<RemediationPage />} />
            <Route path="/reports" element={<Navigate to="/results" replace />} />
            <Route path="/settings" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;