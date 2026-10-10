import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  HiOutlineDeviceMobile, 
  HiOutlineDesktopComputer, 
  HiOutlineLightningBolt, 
  HiOutlinePlusCircle, 
  HiOutlineChartBar, 
  HiOutlineRefresh, 
  HiOutlineCheckCircle, 
  HiOutlineTrash, 
  HiOutlineDatabase, 
  HiOutlinePencilAlt, 
  HiOutlineX, 
  HiOutlineLocationMarker,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineExternalLink
} from 'react-icons/hi';
import { useToast } from '../context/ToastContext';
import LocationPickerModal from '../components/LocationPickerModal';

const categoryIcons = {
  Mobile: HiOutlineDeviceMobile,
  Laptop: HiOutlineDesktopComputer,
  'Home Appliance': HiOutlineLightningBolt,
  'Digital Appliance': HiOutlineDatabase,
};

const categoryXP = {
  Mobile: 50,
  Laptop: 200,
  'Home Appliance': 1000,
  'Digital Appliance': 150,
};

const classBadges = {
  reuse: 'badge-reuse',
  resell: 'badge-resell',
  refurbish: 'badge-refurbish',
  recycle: 'badge-recycle',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [editDevice, setEditDevice] = useState(null);
  const [editForm, setEditForm] = useState({ brand: '', model: '', location: '', description: '', latitude: null, longitude: null });
  const [isEditMapModalOpen, setIsEditMapModalOpen] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const params = user.role === 'seller' || user.role === 'refurbisher' ? { user_id: user.id } : {};
      const [devRes, reqRes] = await Promise.all([
        api.get('/devices', { params }).catch(() => ({ data: [] })),
        api.get('/requests').catch(() => ({ data: [] }))
      ]);
      setDevices(devRes.data || []);
      setPartnerRequests(reqRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this device listing? This cannot be undone.')) return;
    try {
      await api.delete(`/devices/${id}`);
      setDevices(prev => prev.filter(d => d.id !== id));
      addToast('Device listing removed successfully.');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete device.', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/devices/${editDevice.id}`, editForm);
      setDevices(prev => prev.map(d => (d.id === editDevice.id ? { ...d, ...res.data } : d)));
      setEditDevice(null);
      addToast('Device listing updated.');
    } catch (err) {
      console.error(err);
      addToast('Failed to update device.', 'error');
    }
  };

  const openEditModal = (device) => {
    setEditDevice(device);
    setEditForm({
      brand: device.brand || '',
      model: device.model || '',
      location: device.location || '',
      description: device.description || '',
      latitude: device.latitude || null,
      longitude: device.longitude || null
    });
  };

  const total = devices.length;
  const classified = devices.filter((d) => d.classification).length;
  const diverted = devices.filter((d) => ['reuse', 'resell', 'refurbish'].includes(d.classification)).length;
  const recycled = devices.filter((d) => d.classification === 'recycle').length;

  const stats = [
    { label: 'Listed Hardware', value: total, icon: HiOutlineChartBar, bg: 'bg-primary-50 text-primary-700' },
    { label: 'Assessed Devices', value: classified, icon: HiOutlineCheckCircle, bg: 'bg-emerald-50 text-emerald-700' },
    { label: 'Circulated / Diverted', value: diverted, icon: HiOutlineRefresh, bg: 'bg-blue-50 text-blue-700' },
    { label: 'Materials Recycled', value: recycled, icon: HiOutlineTrash, bg: 'bg-rose-50 text-rose-700' },
  ];

  const impactSource = [...devices, ...partnerRequests];
  const totalXPDiverted = impactSource
    .filter((d) => d.classification && d.classification !== 'recycle')
    .reduce((sum, d) => sum + (categoryXP[d.category_name] || 10), 0);
  
  const totalXPRecycled = impactSource
    .filter((d) => d.classification === 'recycle')
    .reduce((sum, d) => sum + (categoryXP[d.category_name] || 10), 0);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      if (statusFilter !== 'All') {
        if (statusFilter === 'unassessed' && d.classification) return false;
        if (statusFilter !== 'unassessed' && d.classification !== statusFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const brand = (d.brand || '').toLowerCase();
        const model = (d.model || '').toLowerCase();
        const loc = (d.location || '').toLowerCase();
        if (!brand.includes(q) && !model.includes(q) && !loc.includes(q)) return false;
      }
      return true;
    });
  }, [devices, statusFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between page-header animate-fade-up">
        <div>
          <h1 className="page-title text-text-primary">
            Overview & Devices
          </h1>
          <p className="page-subtitle">
            {user.role === 'seller'
              ? 'Manage your assessed electronics, circular resale listings, and environmental metrics'
              : 'Enterprise overview of incoming hardware pickups and recovery requests'}
          </p>
        </div>
        {user.role === 'seller' && (
          <Link to="/devices/new" className="btn-primary mt-4 sm:mt-0 self-start sm:self-center">
            <HiOutlinePlusCircle className="w-4 h-4" />
            List New Device
          </Link>
        )}
      </div>

      {/* Sustainability Impact Card (Google Sustainability Style) */}
      <div className="glass-card p-6 sm:p-7 mb-8 animate-fade-up bg-white border border-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
              <HiOutlineRefresh className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-text-primary">Circular Environmental Impact</h2>
                <span className="badge bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
                  Verified Metric
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xl">
                Every device diverted from municipal landfills preserves critical raw minerals (Lithium, Cobalt, Copper) and prevents hazardous e-waste contamination.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-8 bg-surface p-4 rounded-xl border border-border">
            <div>
              <div className="text-2xl font-bold text-emerald-700 tracking-tight">{totalXPDiverted} <span className="text-xs font-semibold text-emerald-800">PTS</span></div>
              <div className="text-xs text-text-muted font-medium mt-0.5">Life Cycle Extended</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <div className="text-2xl font-bold text-primary-700 tracking-tight">{totalXPRecycled} <span className="text-xs font-semibold text-primary-800">PTS</span></div>
              <div className="text-xs text-text-muted font-medium mt-0.5">Materials Recovered</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className="glass-card stat-card animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
            <div className={`stat-icon ${stat.bg}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary tracking-tight">{stat.value}</p>
              <p className="text-xs text-text-muted font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by brand, model, city..."
            className="form-input !pl-9 !py-2 !text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-text-muted mr-1 hidden sm:inline">Status:</span>
          {[
            { label: 'All', val: 'All' },
            { label: 'Needs Assessment', val: 'unassessed' },
            { label: 'Reuse', val: 'reuse' },
            { label: 'Resell', val: 'resell' },
            { label: 'Refurbish', val: 'refurbish' },
            { label: 'Recycle', val: 'recycle' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setStatusFilter(opt.val)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap border ${
                statusFilter === opt.val
                  ? 'bg-primary-700 text-white border-primary-700 font-semibold'
                  : 'bg-surface text-text-secondary border-border hover:bg-surface-lighter hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Device Cards Grid */}
      {filteredDevices.length === 0 ? (
        <div className="glass-card p-14 text-center animate-fade-up">
          <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
            <HiOutlineDeviceMobile className="w-7 h-7 text-text-muted" />
          </div>
          <h2 className="text-base font-bold text-text-primary mb-1">No hardware items found</h2>
          <p className="text-text-secondary text-xs max-w-sm mx-auto mb-5">
            {searchQuery || statusFilter !== 'All'
              ? 'No listed devices match your current filters.'
              : 'Get started by listing your first device for AI condition inspection and matching.'}
          </p>
          {user.role === 'seller' && (
            <Link to="/devices/new" className="btn-primary !text-xs !py-2.5">
              <HiOutlinePlusCircle className="w-4 h-4" />
              List First Device
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.map((device, i) => {
            const Icon = categoryIcons[device.category_name] || HiOutlineDeviceMobile;
            return (
              <div
                key={device.id}
                className="glass-card overflow-hidden flex flex-col justify-between animate-fade-up hover:border-primary-300 transition-all"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div>
                  {/* Image */}
                  <div className="w-full h-44 bg-surface flex items-center justify-center relative overflow-hidden">
                    {device.images && device.images.length > 0 ? (
                      <img 
                        src={device.images[0]} 
                        alt={device.model || 'Device'} 
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                      />
                    ) : (
                      <Icon className="w-12 h-12 text-text-muted/40" />
                    )}
                    {device.classification ? (
                      <span className={`absolute top-3 right-3 badge capitalize shadow-sm ${classBadges[device.classification] || 'badge-neutral'}`}>
                        {device.classification}
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 badge bg-amber-50 text-amber-800 border-amber-200 text-xs">
                        Pending Assessment
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 pb-3">
                    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                      {device.category_name}
                    </div>
                    <h3 className="font-bold text-text-primary text-base truncate">
                      {device.brand} {device.model}
                    </h3>
                    
                    {device.location && (
                      <div className="text-xs text-text-secondary mt-2 flex items-center gap-1.5 truncate">
                        <HiOutlineLocationMarker className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                        <span className="truncate">{device.location}</span>
                      </div>
                    )}

                    {device.description && (
                      <p className="text-xs text-text-muted italic line-clamp-1 mt-1.5">
                        "{device.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-border mt-3">
                  {device.classification ? (
                    <Link to={`/devices/${device.id}/result`} className="btn-ghost flex-1 text-center justify-center !text-xs !py-2">
                      Results
                    </Link>
                  ) : (
                    <Link to={`/devices/${device.id}/questionnaire`} className="btn-primary flex-1 text-center justify-center !text-xs !py-2">
                      Assess Now
                    </Link>
                  )}
                  
                  <Link to={`/devices/${device.id}`} className="btn-ghost !text-xs !py-2 px-2.5" title="View details">
                    <HiOutlineExternalLink className="w-4 h-4" />
                  </Link>

                  {user.role === 'seller' && (
                    <>
                      <button 
                        onClick={() => openEditModal(device)} 
                        className="btn-ghost !text-xs !py-2 px-2.5 cursor-pointer" 
                        title="Edit details"
                      >
                        <HiOutlinePencilAlt className="w-4 h-4 text-primary-700" />
                      </button>
                      <button 
                        onClick={() => handleDelete(device.id)} 
                        className="btn-ghost !text-xs !py-2 px-2.5 cursor-pointer hover:!border-rose-200" 
                        title="Delete listing"
                      >
                        <HiOutlineTrash className="w-4 h-4 text-rose-700" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal (Google Dialog Style) */}
      {editDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-border shadow-xl w-full max-w-md p-6 relative animate-fade-up">
            <button 
              onClick={() => setEditDevice(null)} 
              className="absolute top-5 right-5 text-text-muted hover:text-text-primary p-1 rounded-full hover:bg-surface transition-colors cursor-pointer"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-text-primary mb-1">
              Edit Device Listing
            </h2>
            <p className="text-xs text-text-secondary mb-5">
              Update hardware identification and location details.
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    className="form-input !py-2 !text-xs" 
                    value={editForm.brand} 
                    onChange={e => setEditForm({...editForm, brand: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="form-label">Model</label>
                  <input 
                    type="text" 
                    className="form-input !py-2 !text-xs" 
                    value={editForm.model} 
                    onChange={e => setEditForm({...editForm, model: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label !mb-0">Location</label>
                  <button
                    type="button"
                    onClick={() => setIsEditMapModalOpen(true)}
                    className="text-xs text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <HiOutlineLocationMarker className="w-3.5 h-3.5" /> Select on Map
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input !py-2 !text-xs"
                  placeholder="e.g. Austin, Texas"
                  value={editForm.location}
                  onChange={e => setEditForm({...editForm, location: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">Seller Comments</label>
                <textarea 
                  className="form-input min-h-[70px] !py-2 !text-xs" 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                />
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setEditDevice(null)} className="btn-ghost flex-1 justify-center !text-xs !py-2 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center !text-xs !py-2 cursor-pointer">
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <LocationPickerModal
            isOpen={isEditMapModalOpen}
            onClose={() => setIsEditMapModalOpen(false)}
            initialLocationName={editForm.location}
            onSelectLocation={(loc, coords) => setEditForm(prev => ({ 
              ...prev, 
              location: loc,
              latitude: coords?.lat || null,
              longitude: coords?.lng || null
            }))}
          />
        </div>
      )}
    </div>
  );
}
