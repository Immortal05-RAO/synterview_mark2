import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/Dashboard';
import { InterviewSetupPage } from './pages/InterviewSetup';
import { InterviewRoomPage } from './pages/InterviewRoom';
import { InterviewCompletionPage } from './pages/InterviewCompletion';
import { InterviewReportPage } from './pages/InterviewReport';
import { HistoryPage } from './pages/History';
import { ProgressPage } from './pages/Progress';
import { ProfilePage } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/interview/new" element={<InterviewSetupPage />} />
                  <Route path="/interview/:id" element={<InterviewRoomPage />} />
                  <Route path="/interview/:id/complete" element={<InterviewCompletionPage />} />
                  <Route path="/interview/:id/report" element={<InterviewReportPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
