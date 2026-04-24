import React from 'react';

const styles = {
  card: {
    background: 'linear-gradient(135deg, #1e1e3a, #1a1a2e)',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: '12px',
    color: '#8888aa',
    marginBottom: '4px',
    fontWeight: 500,
  },
  value: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ffffff',
  },
  sub: {
    fontSize: '11px',
    marginTop: '2px',
    fontWeight: 500,
  },
};

const colorMap = {
  orange: { bg: 'rgba(243, 156, 18, 0.15)', color: '#f39c12' },
  green: { bg: 'rgba(39, 174, 96, 0.15)', color: '#27ae60' },
  red: { bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
  blue: { bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
  purple: { bg: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6' },
};

function StatCard({ icon, label, value, sub, color = 'blue', onClick }) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      style={styles.card}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = c.color;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#2a2a4a';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ ...styles.iconBox, background: c.bg }}>
        {icon}
      </div>
      <div style={styles.info}>
        <div style={styles.label}>{label}</div>
        <div style={styles.value}>{value}</div>
        {sub && <div style={{ ...styles.sub, color: c.color }}>{sub}</div>}
      </div>
    </div>
  );
}

export default StatCard;
