import { NavLink } from 'react-router-dom';
import { Home, Wind, BookOpen, BarChart3, MessageCircle, Siren } from 'lucide-react';

const navItems = [
  { to: '/app', icon: Home, label: 'Home' },
  { to: '/app/breathing', icon: Wind, label: 'Breathe' },
  { to: '/app/journal', icon: BookOpen, label: 'Journal' },
  { to: '/app/dashboard', icon: BarChart3, label: 'Insights' },
  { to: '/app/chat', icon: MessageCircle, label: 'AI Chat' },
];

export default function BottomNav() {
  return (
    <nav className="glass-strong" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, borderTop: '1px solid rgba(229,231,235,0.5)' }}>
      <div style={{ maxWidth: 672, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '4px 8px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'text-brand-600 scale-110'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-brand-50 shadow-lg shadow-brand-500/10' : ''
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function EmergencyButton() {
  return (
    <NavLink
      to="/app/emergency"
      className={({ isActive }) =>
        `fixed bottom-20 right-4 z-50 p-3 rounded-full transition-all duration-300 shadow-lg ${
          isActive
            ? 'bg-red-500 shadow-red-500/50 scale-110'
            : 'bg-red-500/90 hover:bg-red-500 shadow-red-500/30 hover:scale-105'
        }`
      }
      title="Emergency SOS"
    >
      <Siren size={22} className="text-white" />
    </NavLink>
  );
}
