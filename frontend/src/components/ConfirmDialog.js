import React from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
    animation: 'fadeIn 0.2s ease',
  },
  dialog: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#e0e0e0',
    marginBottom: '8px',
  },
  message: {
    fontSize: '14px',
    color: '#8888aa',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  cancelBtn: {
    padding: '10px 24px',
    background: '#2a2a4a',
    border: '1px solid #3a3a5a',
    borderRadius: '8px',
    color: '#cccce0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  confirmBtn: {
    padding: '10px 24px',
    background: 'rgba(231, 76, 60, 0.2)',
    border: '1px solid rgba(231, 76, 60, 0.4)',
    borderRadius: '8px',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
};

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.dialog} onClick={e => e.stopPropagation()}>
        <div style={styles.icon}>{'\u26A0'}</div>
        <div style={styles.title}>{title || 'Confirm Action'}</div>
        <div style={styles.message}>{message || 'Are you sure you want to proceed?'}</div>
        <div style={styles.buttons}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
