import React, { useState, useEffect } from 'react';

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
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a4a',
  },
  title: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#f39c12',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8888aa',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  body: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 12px',
    background: '#0f0f23',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  select: {
    padding: '10px 12px',
    background: '#0f0f23',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    padding: '10px 12px',
    background: '#0f0f23',
    border: '1px solid #2a2a4a',
    borderRadius: '8px',
    color: '#e0e0e0',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #2a2a4a',
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#2a2a4a',
    border: '1px solid #3a3a5a',
    borderRadius: '8px',
    color: '#cccce0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  submitBtn: {
    padding: '10px 20px',
    background: 'rgba(243, 156, 18, 0.2)',
    border: '1px solid rgba(243, 156, 18, 0.4)',
    borderRadius: '8px',
    color: '#f39c12',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};

function FormModal({ title, fields, initialData, onSubmit, onClose }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    } else {
      const defaults = {};
      fields.forEach(f => {
        defaults[f.key] = f.defaultValue || '';
      });
      setFormData(defaults);
    }
  }, [initialData, fields]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button style={styles.closeBtn} onClick={onClose}>{'\u2715'}</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.body}>
            <div style={styles.formGrid}>
              {fields.map(field => (
                <div key={field.key} style={styles.field}>
                  <label style={styles.label}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      style={styles.select}
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {(field.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      style={styles.textarea}
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                    />
                  ) : field.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={!!formData[field.key]}
                      onChange={e => handleChange(field.key, e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  ) : (
                    <input
                      style={styles.input}
                      type={field.type || 'text'}
                      value={formData[field.key] || ''}
                      onChange={e => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                      step={field.type === 'number' ? field.step || 'any' : undefined}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.submitBtn}>
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormModal;
