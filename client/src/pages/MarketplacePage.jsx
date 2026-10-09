import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineLightningBolt, HiOutlineShoppingCart, HiOutlineCheckCircle, HiOutlineDatabase } from 'react-icons/hi';

const categoryIcons = {
  Mobile: HiOutlineDeviceMobile,
  Laptop: HiOutlineDesktopComputer,
  'Home Appliance': HiOutlineLightningBolt,
  'Digital Appliance': HiOutlineDatabase,
};

const classColors = {
  reuse: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
  resell: 'text-cyan-700 bg-cyan-500/10 border-cyan-500/20',
  refurbish: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  recycle: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    if (user.role === 'seller') {
      navigate('/');
      return;
    }
    loadAvailableDevices();
  }, [user.role, navigate]);

  const loadAvailableDevices = async () => {
    try {
      const res = await api.get('/devices/available');
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const claimDevice = async (deviceId) => {
    setClaiming(deviceId);
    try {
      await api.post(`/matches/claim/${deviceId}`);
      addToast('Device successfully claimed! It has been moved to your Requests.');
      navigate('/requests');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to claim device.');
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredDevices = filterCategory === 'All'
    ? devices
    : devices.filter((d) => d.category_name === filterCategory);

  const filterOptions = ['All', 'Mobile', 'Laptop', 'Home Appliance', 'Digital Appliance'];

  return (
    <div className="page-container relative">
      <div className="glow-orb w-[400px] h-[400px] bg-cyan-500/10 top-0 left-0" />
      
      <div className="page-header relative z-10 animate-fade-up">
        <h1 className="page-title text-text-primary">
          <span className="gradient-text">Available Devices</span>
        </h1>
        <p className="page-subtitle">
          Browse and claim available devices from sellers across the platform.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 relative z-10 animate-fade-up" style={{ animationDelay: '80ms' }}>
        {filterOptions.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
              filterCategory === cat
                ? 'bg-primary-500/20 text-primary-400 border-primary-500/40 shadow-lg shadow-primary-500/10'
                : 'bg-surface-light text-text-muted border-border hover:bg-surface hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative z-10">
        {filteredDevices.length === 0 ? (
          <div className="glass-card p-14 text-center animate-fade-up">
            <div className="w-20 h-20 rounded-2xl bg-surface-lighter flex items-center justify-center mx-auto mb-5">
              <HiOutlineShoppingCart className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">No devices found</h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              There are currently no unmatched devices available in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDevices.map((device, i) => {
              const Icon = categoryIcons[device.category_name] || HiOutlineDeviceMobile;
              const isTargetRecycler = device.classification === 'recycle';
              const canClaim = (user.role === 'admin') || (user.role === 'recycler' && isTargetRecycler) || (user.role === 'refurbisher' && !isTargetRecycler);

              return (
                <div
                  key={device.id}
                  className="glass-card overflow-hidden flex flex-col justify-between animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div>
                    {/* Image */}
                    <div className="w-full h-44 bg-surface-lighter flex items-center justify-center relative">
                      {device.image_url ? (
                        <img src={device.image_url} alt={device.model || 'Device'} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="w-14 h-14 text-text-muted/50" />
                      )}
                      {device.classification && (
                        <div className={`absolute top-3 right-3 badge capitalize shadow-lg ${classColors[device.classification]}`}>
                          {device.classification}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5 pb-4">
                      <h3 className="font-semibold text-text-primary truncate text-lg">
                        {device.brand} {device.model}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-text-secondary">
                        <span className="font-medium text-text-muted">{device.category_name}</span>
                        {device.location && <span>📍 {device.location}</span>}
                        <span>Seller: <strong className="text-text-primary">{device.user_name}</strong></span>
                      </div>
                      
                      {!canClaim && user.role !== 'admin' && (
                        <div className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          Only {isTargetRecycler ? 'recyclers' : 'refurbishers'} can claim this.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="px-5 pb-5 pt-2 flex gap-2">
                    <Link to={`/devices/${device.id}`} className="btn-ghost flex-1 text-center justify-center">
                      View Details
                    </Link>
                    {canClaim && (
                      <button 
                        onClick={() => claimDevice(device.id)}
                        disabled={claiming === device.id}
                        className="btn-primary flex-1 justify-center relative overflow-hidden"
                      >
                        {claiming === device.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <HiOutlineCheckCircle className="w-5 h-5" />
                            Claim Device
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
