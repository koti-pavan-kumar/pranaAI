import { Outlet } from 'react-router-dom';
import BottomNav, { EmergencyButton } from './BottomNav';
import DesktopSidebar from './DesktopSidebar';

export default function Layout() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Floating Background Shapes */}
      <div className="floating-shapes">
        <div className="shape" style={{ background: 'linear-gradient(135deg, #14b8a6, #06b6d4)' }}></div>
        <div className="shape" style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}></div>
        <div className="shape" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}></div>
        <div className="shape" style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}></div>
      </div>

      {/* Desktop */}
      <div className="only-md-flex" style={{ position: 'relative', zIndex: 1 }}>
        <DesktopSidebar />
        <main style={{ flex: 1, marginLeft: 72, padding: 28 }}>
          <Outlet />
        </main>
      </div>

      {/* Mobile */}
      <div className="only-mobile" style={{ position: 'relative', zIndex: 1 }}>
        <main style={{ padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto' }}>
          <Outlet />
        </main>
        <BottomNav />
        <EmergencyButton />
      </div>
    </div>
  );
}
