import { NavLink } from 'react-router-dom';
import { Home, Wind, BookOpen, BarChart3, MessageCircle, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/app', icon: Home, label: 'Home' },
  { to: '/app/breathing', icon: Wind, label: 'Breathe' },
  { to: '/app/journal', icon: BookOpen, label: 'Journal' },
  { to: '/app/dashboard', icon: BarChart3, label: 'Insights' },
  { to: '/app/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/app/telemetry', icon: Activity, label: 'Telemetry' },
];

export default function DesktopSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 72,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          boxShadow: '0 4px 12px rgba(20,184,166,0.3)',
        }}
      >
        <Wind size={20} color="white" />
      </div>

      {/* Nav Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 8px',
              borderRadius: 12,
              textDecoration: 'none',
              transition: 'all 0.2s',
              color: isActive ? '#14b8a6' : '#64748b',
              background: isActive ? 'rgba(20,184,166,0.12)' : 'transparent',
            })}
            title={label}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/'); }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          color: '#64748b',
          transition: 'all 0.2s',
        }}
        title="Logout"
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#ef4444'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; }}
      >
        <LogOut size={18} />
      </button>
    </nav>
  );
}
