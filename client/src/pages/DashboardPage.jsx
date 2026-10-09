import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineLightningBolt, HiOutlinePlusCircle, HiOutlineChartBar, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineTrash, HiOutlineDatabase, HiOutlinePencilAlt, HiOutlineX } from 'react-icons/hi';
import { useToast } from '../context/ToastContext';

const categoryIcons = {
  Mobile: HiOutlineDeviceMobile,
  Laptop: HiOutlineDesktopComputer,
  'Home Appliance': HiOutlineLightningBolt,
  'Digital Appliance': HiOutlineDatabase,
};

const categoryXP = {
  Mobile: 50, // 50 XP
  Laptop: 200, // 200 XP
  'Home Appliance': 1000, // 1000 XP
  'Digital Appliance': 150, // 150 XP
};

const classColors = {
  reuse: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
  resell: 'text-cyan-700 bg-cyan-500/10 border-cyan-500/20',
  refurbish: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  recycle: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [editDevice, setEditDevice] = useState(null);
  const [editForm, setEditForm] = useState({ brand: '', model: '', location: '', description: '' });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const params = user.role === 'seller' ? { user_id: user.id } : {};
      const res = await api.get('/devices', { params });
      setDevices(res.data);

      if (user.role === 'recycler' || user.role === 'refurbisher') {
        const reqRes = await api.get('/requests');
        setPartnerRequests(reqRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device? This cannot be undone.')) return;
    try {
      await api.delete(`/devices/${id}`);
      setDevices(devices.filter(d => d.id !== id));
      addToast('Device deleted successfully.');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete device.', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/devices/${editDevice.id}`, editForm);
      setDevices(devices.map(d => (d.id === editDevice.id ? { ...d, ...res.data } : d)));
      setEditDevice(null);
      addToast('Device updated successfully.');
    } catch (err) {
      console.error(err);
      addToast('Failed to update device.', 'error');
    }
  };

  const openEditModal = (device) => {
    setEditDevice(device);
    setEditForm({ brand: device.brand || '', model: device.model || '', location: device.location || '', description: device.description || '' });
  };

  const total = devices.length;
  const classified = devices.filter((d) => d.classification).length;
  const reusable = devices.filter((d) => ['reuse', 'resell', 'refurbish'].includes(d.classification)).length;
  const recycled = devices.filter((d) => d.classification === 'recycle').length;

  const stats = [
    { label: 'Total Devices', value: total, icon: HiOutlineChartBar, gradient: 'from-primary-500 to-primary-600' },
    { label: 'Classified', value: classified, icon: HiOutlineCheckCircle, gradient: 'from-emerald-500 to-emerald-600' },
    { label: 'Diverted', value: reusable, icon: HiOutlineRefresh, gradient: 'from-cyan-500 to-cyan-600' },
    { label: 'Recycled', value: recycled, icon: HiOutlineTrash, gradient: 'from-rose-500 to-rose-600' },
  ];

  const impactSource = (user.role === 'recycler' || user.role === 'refurbisher') 
    ? partnerRequests 
    : devices;

  // Calculate environmental impact (Gamified XP)
  const totalXPDiverted = impactSource
    .filter((d) => d.classification && d.classification !== 'recycle') // Reused/Refurbished/Resold
    .reduce((sum, d) => sum + (categoryXP[d.category_name] || 10), 0);
  
  const totalXPRecycled = impactSource
    .filter((d) => d.classification === 'recycle')
    .reduce((sum, d) => sum + (categoryXP[d.category_name] || 10), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container relative">
      {/* Background orbs */}
      <div className="glow-orb w-[400px] h-[400px] bg-primary-600/10 top-0 right-0" />
      <div className="glow-orb w-[300px] h-[300px] bg-emerald-500/8 bottom-[20%] left-0" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between page-header relative z-10 animate-fade-up">
        <div>
          <h1 className="page-title text-text-primary">
            Welcome back, <span className="gradient-text">{user.name}</span>
          </h1>
          <p className="page-subtitle">
            {user.role === 'seller'
              ? 'Manage your listed devices and track their journey'
              : 'View incoming devices and manage requests'}
          </p>
        </div>
        {user.role === 'seller' && (
          <Link to="/devices/new" className="btn-primary mt-4 sm:mt-0">
            <HiOutlinePlusCircle className="w-5 h-5" />
            List Device
          </Link>
        )}
      </div>

      {/* Environmental Impact Banner */}
      <div className="glass-card mb-10 overflow-hidden relative z-10 animate-fade-up shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/10" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 flex-shrink-0">
              <HiOutlineRefresh className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight mb-1">
                {user.role === 'admin' ? 'Global Environmental Impact' : 'Your Environmental Impact'}
              </h2>
              <p className="text-text-secondary text-sm sm:text-base max-w-md">
                {user.role === 'admin'
                  ? 'Earn Eco-XP for processing and recovering materials. Every device counts!'
                  : 'Earn Eco-XP for every device you process and keep out of a landfill. Level up your sustainability!'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 sm:gap-8 bg-white/60 p-4 rounded-2xl border border-emerald-500/20 w-full sm:w-auto justify-center">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-emerald-600">{totalXPDiverted}<span className="text-lg font-bold text-emerald-600/70 ml-1">XP</span></p>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mt-1">Life Extended</p>
            </div>
            <div className="w-px bg-emerald-500/20" />
            <div className="text-center">
              <p className="text-3xl font-extrabold text-teal-600">{totalXPRecycled}<span className="text-lg font-bold text-teal-600/70 ml-1">XP</span></p>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider mt-1">Material Recovered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 relative z-10">
        {stats.map((stat, i) => (
          <div key={stat.label} className="glass-card stat-card animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`stat-icon bg-gradient-to-br ${stat.gradient}`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tracking-tight">{stat.value}</p>
              <p className="text-xs text-text-muted font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Device Grid */}
      <div className="relative z-10">
        {devices.length === 0 ? (
          <div className="glass-card p-14 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-surface-lighter flex items-center justify-center mx-auto mb-5">
              <HiOutlineDeviceMobile className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">No devices yet</h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              Start by listing your first electronic device for assessment.
            </p>
            {user.role === 'seller' && (
              <Link to="/devices/new" className="btn-primary">
                <HiOutlinePlusCircle className="w-5 h-5" />
                List Your First Device
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {devices.map((device, i) => {
              const Icon = categoryIcons[device.category_name] || HiOutlineDeviceMobile;
              return (
                <div
                  key={device.id}
                  className="glass-card group overflow-hidden animate-fade-up flex flex-col"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Image */}
                  <div className="w-full h-44 bg-surface-lighter overflow-hidden flex items-center justify-center">
                    {device.image_url ? (
                      <img src={device.image_url} alt={device.model || 'Device'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Icon className="w-14 h-14 text-text-muted/50" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary truncate">
                          {device.brand} {device.model}
                        </h3>
                        <p className="text-sm text-text-muted mt-0.5">{device.category_name}</p>
                        {device.location && (
                          <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                            <span className="opacity-70">📍</span> {device.location}
                          </p>
                        )}
                      </div>
                      {device.classification && (
                        <span className={`badge capitalize flex-shrink-0 ${classColors[device.classification] || ''}`}>
                          {device.classification}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 pt-2 flex gap-2">
                    <Link to={`/devices/${device.id}`} className="btn-ghost flex-1 justify-center text-sm py-2">
                      View
                    </Link>
                    {user.role === 'seller' && (
                      <>
                        <button onClick={() => openEditModal(device)} className="btn-ghost flex-1 justify-center text-sm py-2 text-primary-500 hover:bg-primary-500/10 border border-primary-500/20">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(device.id)} className="btn-ghost flex-1 justify-center text-sm py-2 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-6 relative animate-fade-up">
            <button onClick={() => setEditDevice(null)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary">
              <HiOutlineX className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <HiOutlinePencilAlt className="text-primary-500" /> Edit Device
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Brand</label>
                  <input type="text" className="input-field" value={editForm.brand} onChange={e => setEditForm({...editForm, brand: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Model</label>
                  <input type="text" className="input-field" value={editForm.model} onChange={e => setEditForm({...editForm, model: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Location</label>
                <input type="text" className="input-field" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea className="input-field min-h-[80px]" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditDevice(null)} className="btn-ghost flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
