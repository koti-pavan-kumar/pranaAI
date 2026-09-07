import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Breathing from './pages/Breathing';
import Journal from './pages/Journal';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Emergency from './pages/Emergency';
import CameraBreathing from './pages/CameraBreathing';
import Telemetry from './pages/Telemetry';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public — Landing page (always visible) */}
            <Route path="/" element={<Landing />} />

            {/* Public — Auth */}
            <Route path="/login" element={
              <PublicRoute><Login /></PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute><Register /></PublicRoute>
            } />

            {/* Protected — App routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="breathing" element={<Breathing />} />
              <Route path="journal" element={<Journal />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="chat" element={<Chat />} />
              <Route path="telemetry" element={<Telemetry />} />
            </Route>
            <Route path="/app/camera" element={
              <ProtectedRoute>
                <div className="min-h-screen gradient-bg" style={{ color: '#1e293b' }}>
                  <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
                    <CameraBreathing />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/app/emergency" element={
              <ProtectedRoute>
                <div className="min-h-screen gradient-bg" style={{ color: '#1e293b' }}>
                  <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
                    <Emergency />
                  </div>
                </div>
              </ProtectedRoute>
            } />

            {/* Catch all — go to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
