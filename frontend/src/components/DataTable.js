import React from 'react';

const styles = {
  container: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: '#16213e',
    borderBottom: '1px solid #2a2a4a',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#cccce0',
    borderBottom: '1px solid rgba(42, 42, 74, 0.5)',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tr: {
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#6666aa',
    fontSize: '14px',
  },
};

const statusColors = {
  critical: '#e74c3c',
  high: '#e74c3c',
  danger: '#e74c3c',
  warning: '#f39c12',
  medium: '#f39c12',
  caution: '#f39c12',
  normal: '#27ae60',
  low: '#27ae60',
  safe: '#27ae60',
  good: '#27ae60',
  active: '#3498db',
  open: '#3498db',
  pending: '#9b59b6',
  resolved: '#27ae60',
  closed: '#666688',
  inactive: '#666688',
  compliant: '#27ae60',
  'non-compliant': '#e74c3c',
  expired: '#e74c3c',
  valid: '#27ae60',
  poor: '#e74c3c',
  fair: '#f39c12',
  excellent: '#27ae60',
  triggered: '#e74c3c',
  acknowledged: '#f39c12',
  alert: '#e74c3c',
};

function getStatusColor(val) {
  if (!val) return '#666688';
  const lower = String(val).toLowerCase();
  return statusColors[lower] || '#8888aa';
}

function renderCell(value, key) {
  if (value === null || value === undefined) return '-';
  const strVal = String(value);
  const lower = strVal.toLowerCase();
  if (
    key === 'status' || key === 'severity' || key === 'risk_level' ||
    key === 'condition' || key === 'alert_type'
  ) {
    const color = getStatusColor(lower);
    return (
      <span
        style={{
          background: `${color}22`,
          color: color,
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'capitalize',
        }}
      >
        {strVal}
      </span>
    );
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return strVal;
}

function DataTable({ columns, data, onRowClick }) {
  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>No records found. Click "Add New" to create one.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={styles.th}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row._id || row.id || idx}
                style={styles.tr}
                onClick={() => onRowClick && onRowClick(row)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(243, 156, 18, 0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {columns.map(col => (
                  <td key={col.key} style={styles.td}>
                    {renderCell(row[col.key], col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
