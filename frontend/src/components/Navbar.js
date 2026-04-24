import React from 'react';

const styles = {
  navbar: {
    height: '56px',
    background: 'linear-gradient(90deg, #1a1a2e, #16213e)',
    borderBottom: '1px solid #2a2a4a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#e0e0e0',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  badge: {
    fontSize: '11px',
    background: 'rgba(39, 174, 96, 0.2)',
    color: '#27ae60',
    padding: '4px 10px',
    borderRadius: '12px',
    fontWeight: 600,
  },
  time: {
    fontSize: '12px',
    color: '#8888aa',
  },
};

function Navbar({ title }) {
  const now = new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={styles.navbar}>
      <div style={styles.title}>{title || 'AI Safety Monitor'}</div>
      <div style={styles.right}>
        <span style={styles.badge}>{'\u25CF'} System Online</span>
        <span style={styles.time}>{now}</span>
      </div>
    </div>
  );
}

export default Navbar;
