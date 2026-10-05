import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DeviceFormPage from './pages/DeviceFormPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import QuestionnairePage from './pages/QuestionnairePage';
import ResultPage from './pages/ResultPage';
import ComponentAssessmentPage from './pages/ComponentAssessmentPage';
import ComponentResultsPage from './pages/ComponentResultsPage';
import RequestsPage from './pages/RequestsPage';
import MatchPage from './pages/MatchPage';
import AdminPage from './pages/AdminPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-text-secondary">Loading ReCircuit…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className={user ? 'pt-16' : ''}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/devices/new" element={
            <ProtectedRoute roles={['seller']}>
              <DeviceFormPage />
            </ProtectedRoute>
          } />

          <Route path="/devices/:deviceId" element={
            <ProtectedRoute><DeviceDetailPage /></ProtectedRoute>
          } />

          <Route path="/devices/:deviceId/questionnaire" element={
            <ProtectedRoute><QuestionnairePage /></ProtectedRoute>
          } />

          <Route path="/devices/:deviceId/result" element={
            <ProtectedRoute><ResultPage /></ProtectedRoute>
          } />

          <Route path="/devices/:deviceId/components" element={
            <ProtectedRoute><ComponentAssessmentPage /></ProtectedRoute>
          } />

          <Route path="/devices/:deviceId/components/results" element={
            <ProtectedRoute><ComponentResultsPage /></ProtectedRoute>
          } />

          <Route path="/devices/:deviceId/match" element={
            <ProtectedRoute><MatchPage /></ProtectedRoute>
          } />

          <Route path="/requests" element={
            <ProtectedRoute><RequestsPage /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
