import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store';
import { AuthProvider, useAuth } from './auth';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';

// Lazy-load all page components for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Home = lazy(() => import('./pages/Home'));
const Breathing = lazy(() => import('./pages/Breathing'));
const Journal = lazy(() => import('./pages/Journal'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Emergency = lazy(() => import('./pages/Emergency'));
const CameraBreathing = lazy(() => import('./pages/CameraBreathing'));
const Telemetry = lazy(() => import('./pages/Telemetry'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

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

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              {/* Public — Landing page (always visible) */}
              <Route path="/" element={
                <PageWrapper><Landing /></PageWrapper>
              } />

              {/* Public — Auth */}
              <Route path="/login" element={
                <PublicRoute><PageWrapper><Login /></PageWrapper></PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute><PageWrapper><Register /></PageWrapper></PublicRoute>
              } />

              {/* Protected — App routes */}
              <Route path="/app" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={
                  <PageWrapper><Home /></PageWrapper>
                } />
                <Route path="breathing" element={
                  <PageWrapper><Breathing /></PageWrapper>
                } />
                <Route path="journal" element={
                  <PageWrapper><Journal /></PageWrapper>
                } />
                <Route path="dashboard" element={
                  <PageWrapper><Dashboard /></PageWrapper>
                } />
                <Route path="chat" element={
                  <PageWrapper><Chat /></PageWrapper>
                } />
                <Route path="telemetry" element={
                  <PageWrapper><Telemetry /></PageWrapper>
                } />
              </Route>
              <Route path="/app/camera" element={
                <ProtectedRoute>
                  <div className="min-h-screen gradient-bg" style={{ color: '#1e293b' }}>
                    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
                      <PageWrapper><CameraBreathing /></PageWrapper>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/app/emergency" element={
                <ProtectedRoute>
                  <div className="min-h-screen gradient-bg" style={{ color: '#1e293b' }}>
                    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
                      <PageWrapper><Emergency /></PageWrapper>
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
    </ErrorBoundary>
  );
}
