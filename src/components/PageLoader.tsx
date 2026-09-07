import { motion } from 'framer-motion';

export default function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ textAlign: 'center' }}
      >
        {/* Animated breathing circle */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            margin: '0 auto 20px',
            boxShadow: '0 4px 20px rgba(20, 184, 166, 0.3)',
          }}
        />

        {/* Loading text */}
        <p style={{
          fontSize: 14,
          color: '#64748b',
          fontWeight: 500,
          letterSpacing: '0.05em',
        }}>
          Loading...
        </p>

        {/* Skeleton bars */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {[120, 96, 108].map((width, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              style={{
                width,
                height: 8,
                borderRadius: 4,
                background: '#e2e8f0',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
