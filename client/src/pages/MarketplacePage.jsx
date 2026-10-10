import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  HiOutlineDeviceMobile, 
  HiOutlineDesktopComputer, 
  HiOutlineLightningBolt, 
  HiOutlineShoppingCart, 
  HiOutlineCheckCircle, 
  HiOutlineDatabase, 
  HiOutlineSearch, 
  HiOutlineLocationMarker, 
  HiOutlineCog, 
  HiOutlineChip, 
  HiOutlineFilter, 
  HiOutlineSparkles, 
  HiOutlineX, 
  HiOutlineRefresh,
  HiOutlineClipboardCheck,
  HiOutlineClipboardList,
  HiOutlineInformationCircle,
  HiOutlineTrash
} from 'react-icons/hi';

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

const classColors = {
  reuse: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  resell: 'text-blue-700 bg-blue-50 border-blue-200',
  refurbish: 'text-amber-700 bg-amber-50 border-amber-200',
  recycle: 'text-rose-700 bg-rose-50 border-rose-200',
};

const componentIcons = {
  Display: HiOutlineDesktopComputer,
  Screen: HiOutlineDesktopComputer,
  Battery: HiOutlineLightningBolt,
  RAM: HiOutlineChip,
  Storage: HiOutlineDatabase,
  SSD: HiOutlineDatabase,
  Motherboard: HiOutlineCog,
  Camera: HiOutlineSparkles,
  default: HiOutlineCog,
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Active tab: 'devices' | 'components'
  const [activeTab, setActiveTab] = useState('devices');

  const [devices, setDevices] = useState([]);
  const [components, setComponents] = useState([]);
  const [recyclerRequests, setRecyclerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  // Diagnostic Assessment Modal State
  const [assessingDevice, setAssessingDevice] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCondition, setFilterCondition] = useState(user?.role === 'recycler' ? 'recycle' : 'All');
  const [filterComponentType, setFilterComponentType] = useState('All');
  
  // Geolocation & Radius
  const [userCoords, setUserCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [radiusKm, setRadiusKm] = useState('All');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (user?.role === 'recycler') {
      setFilterCondition('recycle');
    } else if ((user?.role === 'seller' || user?.role === 'refurbisher') && filterCondition === 'recycle') {
      setFilterCondition('All');
    }
  }, [user?.role]);

  useEffect(() => {
    loadData();
  }, [userCoords, radiusKm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (userCoords?.lat && userCoords?.lng) {
        queryParams.append('lat', userCoords.lat);
        queryParams.append('lng', userCoords.lng);
        if (radiusKm !== 'All') {
          queryParams.append('radius_km', radiusKm);
        }
      }

      const [devRes, compRes, reqRes] = await Promise.all([
        api.get(`/devices/available?${queryParams.toString()}`).catch(() => ({ data: [] })),
        user?.role !== 'recycler'
          ? api.get(`/components/available?${queryParams.toString()}`).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        user?.role === 'recycler' ? api.get('/requests').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      setDevices(devRes.data || []);
      setComponents(user?.role !== 'recycler' ? (compRes.data || []) : []);
      if (user?.role === 'recycler') {
        setRecyclerRequests(reqRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load marketplace items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recycler Embedded Operations Stats
  const recyclerStats = useMemo(() => {
    if (user?.role !== 'recycler') return null;
    const activeClaims = recyclerRequests.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length;
    const completedCount = recyclerRequests.filter((r) => r.status === 'completed').length;
    const totalXP = recyclerRequests
      .filter((r) => r.status === 'completed')
      .reduce((sum, r) => sum + (categoryXP[r.category_name] || 50), 0);
    return {
      availableFeed: devices.length,
      activeClaims,
      completedCount,
      totalXP,
    };
  }, [user?.role, recyclerRequests, devices.length]);

  // Assessment Modal Handlers
  const openAssessmentModal = async (device) => {
    setAssessingDevice(device);
    setAssessmentLoading(true);
    setAssessmentData(null);
    try {
      const res = await api.get(`/questionnaire/${device.id}`);
      setAssessmentData(res.data);
    } catch (err) {
      console.error('Failed to load assessment report:', err);
      addToast('Could not load detailed diagnostic report.');
    } finally {
      setAssessmentLoading(false);
    }
  };

  const closeAssessmentModal = () => {
    setAssessingDevice(null);
    setAssessmentData(null);
  };

  // Handle Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationName('Nearby Location (GPS)');
        setLocating(false);
        addToast('Location detected! Sorting listings by proximity.');
      },
      (err) => {
        setLocating(false);
        addToast('Could not access your location. You can search by city name.');
      },
      { timeout: 10000 }
    );
  };

  const clearLocation = () => {
    setUserCoords(null);
    setLocationName('');
    setRadiusKm('All');
  };

  // Claim device
  const claimDevice = async (deviceId) => {
    setClaimingId(deviceId);
    try {
      await api.post(`/matches/claim/${deviceId}`);
      addToast('Device successfully requested! Moved to your Requests dashboard.');
      navigate('/requests');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to claim device.');
      setClaimingId(null);
    }
  };

  // Claim salvage component
  const claimComponent = async (componentListingId) => {
    setClaimingId(componentListingId);
    try {
      const res = await api.post(`/components/${componentListingId}/claim`);
      addToast(res.data?.message || 'Component successfully claimed! View in your orders.');
      // Refresh component list
      setComponents((prev) => prev.filter((c) => c.id !== componentListingId));
      navigate('/requests');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to claim component.');
      setClaimingId(null);
    }
  };

  // Filtered devices with strict role-based isolation
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      // Recyclers only see recycle electronics
      if (user?.role === 'recycler' && d.classification !== 'recycle') return false;
      // Consumers and refurbishers only see reuse or other than recycle electronics
      if ((user?.role === 'seller' || user?.role === 'refurbisher') && d.classification === 'recycle') return false;

      // Category filter
      if (filterCategory !== 'All' && d.category_name !== filterCategory) return false;
      // Condition filter
      if (filterCondition !== 'All' && d.classification !== filterCondition) return false;
      // Search query (brand, model, description, location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchBrand = (d.brand || '').toLowerCase().includes(q);
        const matchModel = (d.model || '').toLowerCase().includes(q);
        const matchDesc = (d.description || '').toLowerCase().includes(q);
        const matchLoc = (d.location || '').toLowerCase().includes(q);
        if (!matchBrand && !matchModel && !matchDesc && !matchLoc) return false;
      }
      return true;
    });
  }, [devices, filterCategory, filterCondition, searchQuery, user?.role]);

  // Filtered components
  const filteredComponents = useMemo(() => {
    return components.filter((c) => {
      // Category filter
      if (filterCategory !== 'All' && c.category_name !== filterCategory) return false;
      // Component type filter
      if (filterComponentType !== 'All' && !c.component_name.toLowerCase().includes(filterComponentType.toLowerCase())) {
        return false;
      }
      // Search query (component name, brand, model, location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.component_name || '').toLowerCase().includes(q);
        const matchBrand = (c.brand || '').toLowerCase().includes(q);
        const matchModel = (c.model || '').toLowerCase().includes(q);
        const matchLoc = (c.device_location || '').toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchModel && !matchLoc) return false;
      }
      return true;
    });
  }, [components, filterCategory, filterComponentType, searchQuery]);

  const categories = ['All', 'Mobile', 'Laptop', 'Home Appliance', 'Digital Appliance'];

  // Condition options tailored by role
  const conditionOptions = useMemo(() => {
    if (user?.role === 'recycler') {
      return [{ label: 'Recycle Only', val: 'recycle' }];
    }
    if (user?.role === 'seller' || user?.role === 'refurbisher') {
      return [
        { label: 'All Reusable', val: 'All' },
        { label: 'Reuse', val: 'reuse' },
        { label: 'Resell', val: 'resell' },
        { label: 'Refurbish', val: 'refurbish' },
      ];
    }
    return [
      { label: 'All Conditions', val: 'All' },
      { label: 'Reuse', val: 'reuse' },
      { label: 'Resell', val: 'resell' },
      { label: 'Refurbish', val: 'refurbish' },
      { label: 'Recycle', val: 'recycle' },
    ];
  }, [user?.role]);

  const componentTypeOptions = ['All', 'Display', 'Battery', 'RAM', 'Storage', 'Motherboard', 'Camera'];

  return (
    <div className="page-container relative">
      {/* Header */}
      <div className="page-header relative z-10 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="page-title text-text-primary">
              {user?.role === 'recycler' ? 'E-Waste Recycling Stream' : 'Sustainable Marketplace'}
            </h1>
            <p className="page-subtitle">
              {user?.role === 'recycler'
                ? 'Authorized end-of-life electronics designated for material recovery and circular recycling'
                : 'Verified reusable hardware, refurbished electronics & circular salvage parts'}
            </p>
          </div>

          {/* Tab Switcher (Consumers & Refurbishers only) */}
          {user?.role !== 'recycler' && (
            <div className="inline-flex p-1 bg-surface-light border border-border rounded-full shadow-sm self-start sm:self-center">
              <button
                onClick={() => setActiveTab('devices')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'devices'
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <HiOutlineDeviceMobile className="w-4 h-4" />
                Complete Devices ({filteredDevices.length})
              </button>
              <button
                onClick={() => setActiveTab('components')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === 'components'
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <HiOutlineChip className="w-4 h-4" />
                Salvaged Components ({filteredComponents.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recycler Embedded Operations Dashboard */}
      {user?.role === 'recycler' && recyclerStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 animate-fade-up">
          <div className="glass-card p-4 bg-white flex items-center justify-between border-border">
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Available E-Waste
              </span>
              <span className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 block">
                {recyclerStats.availableFeed}
              </span>
              <span className="text-[10px] text-text-muted mt-0.5 block">Ready for facility intake</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
              <HiOutlineTrash className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 bg-white flex items-center justify-between border-border">
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Active Intake Claims
              </span>
              <span className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 block">
                {recyclerStats.activeClaims}
              </span>
              <span className="text-[10px] text-text-muted mt-0.5 block">Pickups in custody flow</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
              <HiOutlineClipboardList className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 bg-white flex items-center justify-between border-border">
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Completed Cycles
              </span>
              <span className="text-xl sm:text-2xl font-bold text-text-primary mt-0.5 block">
                {recyclerStats.completedCount}
              </span>
              <span className="text-[10px] text-text-muted mt-0.5 block">Certified processed batches</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <HiOutlineCheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-card p-4 bg-white flex items-center justify-between border-border">
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Reclaimed Impact
              </span>
              <span className="text-xl sm:text-2xl font-bold text-primary-700 mt-0.5 block">
                {recyclerStats.totalXP} XP
              </span>
              <span className="text-[10px] text-text-muted mt-0.5 block">Circular mineral points</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
              <HiOutlineLightningBolt className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Location Controls */}
      <div className="glass-card p-5 mb-8 relative z-10 animate-fade-up" style={{ animationDelay: '50ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'devices' ? "Search brand, model, city..." : "Search part name, device, city..."}
              className="form-input !pl-10 !py-2.5 !text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Proximity / Location Filter */}
          <div className="md:col-span-6 flex items-center gap-2">
            {!userCoords ? (
              <button
                onClick={detectLocation}
                disabled={locating}
                className="btn-ghost !py-2.5 !px-3.5 !text-xs sm:!text-sm flex-1 whitespace-nowrap cursor-pointer"
              >
                <HiOutlineLocationMarker className="w-4 h-4 text-primary-700" />
                {locating ? 'Detecting Location…' : 'Sort by Distance (GPS)'}
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-between px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-medium text-emerald-800">
                <span className="flex items-center gap-1.5 truncate">
                  <HiOutlineLocationMarker className="w-4 h-4 flex-shrink-0" />
                  {locationName}
                </span>
                <button
                  onClick={clearLocation}
                  className="text-emerald-700 hover:text-emerald-900 ml-2 font-bold"
                  title="Clear location filter"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Radius Selector */}
            {userCoords && (
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="form-input !w-auto !py-2 !text-xs bg-surface-light border-border rounded-full"
              >
                <option value="All">All Distances</option>
                <option value="25">Within 25 km</option>
                <option value="50">Within 50 km</option>
                <option value="100">Within 100 km</option>
                <option value="250">Within 250 km</option>
              </select>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs font-semibold text-text-muted mr-1 flex items-center gap-1">
            <HiOutlineFilter className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                filterCategory === cat
                  ? 'bg-primary-50 text-primary-700 border-primary-200 font-semibold'
                  : 'bg-surface text-text-secondary border-border hover:bg-surface-lighter hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Condition Pills for Devices */}
          {activeTab === 'devices' && (
            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {conditionOptions.map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setFilterCondition(opt.val)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer border ${
                    filterCondition === opt.val
                      ? 'bg-primary-700 text-white border-primary-700 font-medium'
                      : 'bg-surface text-text-muted border-border hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Component Type Pills */}
          {activeTab === 'components' && (
            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {componentTypeOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterComponentType(type)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer border ${
                    filterComponentType === type
                      ? 'bg-primary-700 text-white border-primary-700 font-medium'
                      : 'bg-surface text-text-muted border-border hover:text-text-primary'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : activeTab === 'devices' ? (
        /* ================= DEVICES LIST ================= */
        filteredDevices.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-surface-lighter flex items-center justify-center mx-auto mb-4">
              <HiOutlineShoppingCart className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1">
              {user?.role === 'recycler' ? 'No recyclable devices available' : 'No matching reusable devices'}
            </h2>
            <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
              {user?.role === 'recycler'
                ? 'No electronics classified for e-waste recycling currently match your filter criteria.'
                : 'No reusable or refurbishable devices currently match your filter criteria.'}
            </p>
            {(searchQuery || filterCategory !== 'All' || filterCondition !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('All');
                  setFilterCondition(user?.role === 'recycler' ? 'recycle' : 'All');
                  clearLocation();
                }}
                className="btn-ghost text-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDevices.map((device, i) => {
              const Icon = categoryIcons[device.category_name] || HiOutlineDeviceMobile;
              const isTargetRecycler = device.classification === 'recycle';
              const canClaim =
                user?.role === 'admin' ||
                (user?.role === 'recycler' && isTargetRecycler) ||
                ((user?.role === 'refurbisher' || user?.role === 'seller') && !isTargetRecycler);

              return (
                <div
                  key={device.id}
                  className="glass-card overflow-hidden flex flex-col justify-between animate-fade-up hover:border-primary-300 transition-all"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div>
                    {/* Image / Media */}
                    <div className="w-full h-44 bg-surface-lighter flex items-center justify-center relative overflow-hidden">
                      {device.images && device.images.length > 0 ? (
                        <img
                          src={device.images[0]}
                          alt={`${device.brand} ${device.model}`}
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                        />
                      ) : (
                        <Icon className="w-12 h-12 text-text-muted/40" />
                      )}

                      {/* Condition Badge */}
                      {device.classification && (
                        <div className={`absolute top-3 right-3 badge capitalize shadow-sm ${classColors[device.classification]}`}>
                          {device.classification}
                        </div>
                      )}

                      {/* Distance Badge if available */}
                      {device.distance_km !== null && device.distance_km !== undefined && (
                        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-surface-light/95 backdrop-blur-sm text-[11px] font-semibold text-text-primary border border-border shadow-sm flex items-center gap-1">
                          <HiOutlineLocationMarker className="w-3.5 h-3.5 text-primary-600" />
                          {device.distance_km} km away
                        </div>
                      )}
                    </div>

                    {/* Device Details */}
                    <div className="p-5 pb-4">
                      <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                        {device.category_name}
                      </div>
                      <h3 className="font-bold text-text-primary text-base truncate">
                        {device.brand} {device.model}
                      </h3>

                      <div className="flex flex-col gap-1 mt-3 text-xs text-text-secondary">
                        {device.location && (
                          <div className="flex items-center gap-1.5 truncate text-text-secondary">
                            <HiOutlineLocationMarker className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                            <span className="truncate">{device.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-text-muted mt-0.5">
                          <span>Listed by:</span>
                          <strong className="text-text-primary font-medium">{device.user_name}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 pt-1 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => openAssessmentModal(device)}
                      className="btn-ghost flex-1 justify-center !text-xs !py-2.5 cursor-pointer flex items-center gap-1.5"
                    >
                      <HiOutlineClipboardCheck className="w-4 h-4 text-primary-700" />
                      Assess Results
                    </button>
                    {canClaim && (
                      <button
                        onClick={() => claimDevice(device.id)}
                        disabled={claimingId === device.id}
                        className="btn-primary flex-1 justify-center !text-xs !py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        {claimingId === device.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : user?.role === 'recycler' ? (
                          <>
                            <HiOutlineRefresh className="w-3.5 h-3.5" />
                            Claim for Recycling
                          </>
                        ) : (
                          <>
                            <HiOutlineShoppingCart className="w-3.5 h-3.5" />
                            Purchase Device
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ================= COMPONENTS LIST ================= */
        filteredComponents.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-surface-lighter flex items-center justify-center mx-auto mb-4">
              <HiOutlineChip className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-1">No salvage components found</h2>
            <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
              When recyclable devices undergo component assessments, tested reusable parts appear here for refurbishing resale.
            </p>
            {(searchQuery || filterCategory !== 'All' || filterComponentType !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('All');
                  setFilterComponentType('All');
                  clearLocation();
                }}
                className="btn-ghost text-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredComponents.map((item, i) => {
              const matchedIconKey = Object.keys(componentIcons).find(k => 
                item.component_name.toLowerCase().includes(k.toLowerCase())
              );
              const CompIcon = componentIcons[matchedIconKey] || componentIcons.default;

              return (
                <div
                  key={item.id}
                  className="glass-card overflow-hidden flex flex-col justify-between animate-fade-up hover:border-emerald-300 transition-all"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="p-5">
                    {/* Header: Icon + Name */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                        <CompIcon className="w-5 h-5" />
                      </div>
                      <span className="badge bg-emerald-50 text-emerald-800 border-emerald-200 text-xs">
                        ✓ Tested Reusable
                      </span>
                    </div>

                    <h3 className="font-bold text-text-primary text-base">
                      {item.component_name}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Harvested from: <strong className="text-text-primary">{item.brand} {item.model}</strong>
                    </p>

                    {/* Diagnostic quote */}
                    {item.reasoning && (
                      <div className="mt-3 p-2.5 rounded-lg bg-surface border border-border text-[11px] text-text-secondary line-clamp-2">
                        {item.reasoning.split('\n')[0]}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-col gap-1 mt-4 text-xs text-text-secondary border-t border-border pt-3">
                      {item.device_location && (
                        <div className="flex items-center gap-1.5 truncate">
                          <HiOutlineLocationMarker className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                          <span className="truncate">{item.device_location}</span>
                          {item.distance_km !== null && item.distance_km !== undefined && (
                            <span className="text-emerald-700 font-semibold ml-1">
                              ({item.distance_km} km)
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-text-muted mt-1">
                        <span>Seller: <strong className="text-text-primary">{item.seller_name}</strong></span>
                        <span className="font-semibold text-emerald-700">
                          {item.price ? `$${item.price}` : 'Salvage Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 pt-1">
                    <button
                      onClick={() => claimComponent(item.id)}
                      disabled={claimingId === item.id}
                      className="btn-primary w-full justify-center !text-xs !py-2.5 cursor-pointer !bg-emerald-600 hover:!bg-emerald-700"
                    >
                      {claimingId === item.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <HiOutlineChip className="w-3.5 h-3.5" />
                          Purchase Component
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  DIAGNOSTIC ASSESSMENT DOSSIER MODAL                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {assessingDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-start justify-between bg-surface-lighter">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary-50 text-primary-800 border-primary-200 text-xs font-semibold">
                    Diagnostic Assessment Dossier
                  </span>
                  <span className={`badge capitalize text-xs shadow-xs ${classColors[assessingDevice.classification]}`}>
                    {assessingDevice.classification}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text-primary mt-1">
                  {assessingDevice.brand} {assessingDevice.model}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {assessingDevice.category_name} • Listed by {assessingDevice.user_name} • 📍 {assessingDevice.location || 'Local intake facility'}
                </p>
              </div>
              <button
                onClick={closeAssessmentModal}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface transition-colors cursor-pointer"
                title="Close"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {assessmentLoading ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-text-muted">Loading diagnostic and intake criteria…</p>
                </div>
              ) : assessmentData ? (
                <>
                  {/* Outcome & Health Score Banner */}
                  <div className="p-4 rounded-xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                        Classification Outcome
                      </span>
                      <p className="text-sm font-bold text-text-primary capitalize mt-0.5">
                        Target Pathway:{' '}
                        <span className={assessingDevice.classification === 'recycle' ? 'text-rose-700 font-extrabold uppercase' : 'text-emerald-700 font-extrabold uppercase'}>
                          {assessmentData.result}
                        </span>
                      </p>
                    </div>
                    {assessmentData.score !== undefined && (
                      <div className="sm:text-right">
                        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                          Diagnostic Health Score
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 sm:justify-end">
                          <span className="text-xl font-black text-text-primary">{assessmentData.score}</span>
                          <span className="text-xs text-text-muted">/ 100</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reasoning Explanation */}
                  {assessmentData.reasoning && (
                    <div className="p-4 rounded-xl border border-border bg-white text-xs space-y-2">
                      <h4 className="font-semibold text-text-primary flex items-center gap-1.5">
                        <HiOutlineInformationCircle className="w-4 h-4 text-primary-700" />
                        Diagnostic Evaluation & Expert System Reasoning
                      </h4>
                      <div className="whitespace-pre-line text-text-secondary leading-relaxed bg-surface/40 p-3 rounded-lg border border-border/60 font-mono text-[11px]">
                        {assessmentData.reasoning}
                      </div>
                    </div>
                  )}

                  {/* Detailed Intake Q&A Responses */}
                  {assessmentData.responses && assessmentData.responses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-text-primary flex items-center justify-between">
                        <span>Intake Diagnostic Q&A Checklist ({assessmentData.responses.length})</span>
                        <span className="text-[11px] text-text-muted font-normal">Recorded during seller intake</span>
                      </h4>
                      <div className="divide-y divide-border border border-border rounded-xl bg-white overflow-hidden max-h-60 overflow-y-auto">
                        {assessmentData.responses.map((r) => {
                          const isPass = r.answer?.toLowerCase() === r.good_answer?.toLowerCase();
                          return (
                            <div key={r.id || r.question_id} className="p-3 text-xs flex items-start justify-between gap-3 hover:bg-surface-lighter transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium">{r.text}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-text-muted">
                                  <span>Recorded: <strong className="text-text-primary uppercase">{r.answer}</strong></span>
                                  <span>• Benchmark: <strong className="uppercase">{r.good_answer}</strong></span>
                                  {r.weight > 0 && <span>• Weight: +{r.weight}</span>}
                                  {r.is_disqualifier && (
                                    <span className="badge bg-amber-50 text-amber-800 border-amber-200 text-[10px] py-0 px-1.5">
                                      Disqualifier
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                                isPass
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : r.is_disqualifier
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {isPass ? '✓ Passed' : r.is_disqualifier ? '✗ Disqualified' : '✗ Failed'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Salvage Modular Components Breakdown */}
                  {assessmentData.components && assessmentData.components.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-text-primary">
                        Salvage Component Breakdown ({assessmentData.components.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {assessmentData.components.map((c) => (
                          <div key={c.id || c.component_id} className="p-3 bg-white rounded-xl border border-border flex items-center justify-between">
                            <span className="font-semibold text-text-primary">{c.component_name}</span>
                            <span className={`badge capitalize text-[10px] ${
                              c.result === 'reusable' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {c.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-xs text-text-muted">
                  No diagnostic assessment records found for this unit.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-surface-lighter flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeAssessmentModal}
                className="btn-ghost !text-xs !py-2 !px-4 cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to={`/devices/${assessingDevice.id}`}
                  className="btn-ghost !text-xs !py-2 !px-3 cursor-pointer"
                >
                  Full Details Page
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const id = assessingDevice.id;
                    closeAssessmentModal();
                    claimDevice(id);
                  }}
                  disabled={claimingId === assessingDevice.id}
                  className="btn-primary !text-xs !py-2 !px-4 cursor-pointer flex items-center gap-1.5"
                >
                  {user?.role === 'recycler' ? (
                    <>
                      <HiOutlineRefresh className="w-3.5 h-3.5" />
                      Claim for Recycling
                    </>
                  ) : (
                    <>
                      <HiOutlineShoppingCart className="w-3.5 h-3.5" />
                      Purchase Device
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
