import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';
import './FeaturePage.css';

function FeaturePage({ config }) {
  const { title, icon, endpoint, columns, formFields } = config;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/${endpoint}`);
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setData(items);
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
    }
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setShowForm(true);
  };

  const handleEdit = () => {
    setEditItem(selectedItem);
    setShowDetail(false);
    setShowForm(true);
  };

  const handleDelete = () => {
    setShowDetail(false);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    const id = selectedItem._id || selectedItem.id;
    try {
      await api.delete(`/${endpoint}/${id}`);
      showToast('Record deleted successfully');
      setShowConfirm(false);
      setSelectedItem(null);
      fetchData();
    } catch {
      showToast('Failed to delete record', 'error');
      setShowConfirm(false);
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editItem) {
        const id = editItem._id || editItem.id;
        await api.put(`/${endpoint}/${id}`, formData);
        showToast('Record updated successfully');
      } else {
        await api.post(`/${endpoint}`, formData);
        showToast('Record created successfully');
      }
      setShowForm(false);
      setEditItem(null);
      fetchData();
    } catch {
      showToast('Failed to save record', 'error');
    }
  };

  const filteredData = data.filter(item => {
    if (!search) return true;
    const lower = search.toLowerCase();
    return Object.values(item).some(val =>
      String(val).toLowerCase().includes(lower)
    );
  });

  return (
    <div>
      <Navbar title={`${icon} ${title}`} />
      <div className="feature-page">
        <div className="feature-page-header">
          <div className="feature-page-title">
            <span className="feature-page-title-icon">{icon}</span>
            <h1>{title}</h1>
            <span className="feature-page-count">{filteredData.length} records</span>
          </div>
          <div className="feature-page-actions">
            <button className="feature-add-btn" onClick={handleAdd}>
              + Add New
            </button>
          </div>
        </div>

        <div className="feature-search">
          <input
            className="feature-search-input"
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="feature-error">{error}</div>}

        {loading ? (
          <div className="feature-loading">
            <div className="feature-loading-spinner">{'\u2699'}</div>
            <div>Loading {title.toLowerCase()}...</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={handleRowClick}
          />
        )}

        {showDetail && selectedItem && (
          <DetailModal
            item={selectedItem}
            endpoint={endpoint}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={() => { setShowDetail(false); setSelectedItem(null); }}
          />
        )}

        {showForm && (
          <FormModal
            title={editItem ? `Edit ${title}` : `New ${title}`}
            fields={formFields}
            initialData={editItem}
            onSubmit={handleFormSubmit}
            onClose={() => { setShowForm(false); setEditItem(null); }}
          />
        )}

        {showConfirm && (
          <ConfirmDialog
            title={`Delete ${title}`}
            message="Are you sure you want to delete this record? This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}

        {toast && (
          <div className={`feature-toast ${toast.type}`}>
            {toast.type === 'success' ? '\u2713' : '\u2717'} {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeaturePage;
