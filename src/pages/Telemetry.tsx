import { motion } from 'framer-motion';
import { Shield, Download, Activity, Clock, Zap } from 'lucide-react';

import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';

export default function Telemetry() {
  const { getFormattedData, exportTelemetry } = useDeviceTelemetry();
  const data = getFormattedData();

  const handleExport = () => {
    const json = exportTelemetry();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pranaai-telemetry-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Content = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Device Telemetry</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>HackTracker-style usage stats for hackathon scoring</p>
      </motion.div>

      {!data ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 48, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Activity size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#64748b' }}>No telemetry data yet. Use the app to generate data.</p>
        </div>
      ) : (
        <>
          {/* Phone-First Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 28, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Phone-First Score</p>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
              style={{ fontSize: 48, fontWeight: 900, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {data.phoneFirstPercentage}%
            </motion.div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginTop: 16, maxWidth: 400, margin: '16px auto 0' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${data.phoneFirstPercentage}%` }} transition={{ delay: 0.3, duration: 1.5 }}
                style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #14b8a6, #06b6d4)' }} />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>Hackathon judges reward phone-first usage (25% of score)</p>
          </motion.div>

          {/* Time Breakdown */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color="#0d9488" /> Time Breakdown
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: '📱 Phone', value: data.phoneTime, color: '#0d9488', bg: '#f0fdfa' },
                { label: '💻 Laptop', value: data.laptopTime, color: '#7c3aed', bg: '#faf5ff' },
                { label: '📊 Total', value: data.totalTime, color: '#0f172a', bg: '#f8fafc' },
              ].map(({ label, value, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color }}>{value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="#f59e0b" /> Interactions
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{data.totalInteractions}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Total Actions</p>
              </div>
              <div style={{ background: '#f0fdfa', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#0d9488' }}>{data.phoneInteractions}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Phone Actions</p>
              </div>
            </div>
          </motion.div>

          {/* Privacy */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} color="#16a34a" />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>100% On-Device Tracking</p>
              <p style={{ fontSize: 11, color: '#15803d' }}>All telemetry in localStorage. No data leaves your phone.</p>
            </div>
          </div>

          {/* Export */}
          <button onClick={handleExport}
            style={{ width: '100%', padding: 14, borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#14b8a6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
            <Download size={16} /> Export Telemetry JSON
          </button>
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="only-md-flex" style={{ flexDirection: 'column' }}><Content /></div>
      <div className="only-mobile"><div style={{ maxWidth: 420, margin: '0 auto' }}><Content /></div></div>
    </div>
  );
}
