import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:3001/api'
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Convenience helpers for the new advanced endpoints
export const reportsApi = {
  safetyScorecard: (weeks_back = 4) => api.get('/reports/safety-scorecard', { params: { weeks_back } }),
  incidentAnalysis: (days = 30) => api.get('/reports/incident-analysis', { params: { days } }),
  exportSafetyReport: (days = 30) => api.get('/export/safety-report', { params: { days }, responseType: 'blob' }),
};

export const aiAdvancedApi = {
  incidentPrediction: (body) => api.post('/ai/incident-prediction', body),
  ppeComplianceScan: (body) => api.post('/ai/ppe-compliance-scan', body),
  evacuationPlan: (body) => api.post('/ai/evacuation-plan', body),
};

export default api;
