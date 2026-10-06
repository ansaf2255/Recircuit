import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineLightningBolt, HiOutlinePlusCircle, HiOutlineChartBar, HiOutlineRefresh, HiOutlineCheckCircle, HiOutlineTrash } from 'react-icons/hi';

const categoryIcons = {
  Mobile: HiOutlineDeviceMobile,
  Laptop: HiOutlineDesktopComputer,
  'Home Appliance': HiOutlineLightningBolt,
};

const classColors = {
  reuse: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  resell: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  refurbish: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  recycle: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const params = user.role === 'seller' ? { user_id: user.id } : {};
      const res = await api.get('/devices', { params });
      setDevices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
                <Link
                  key={device.id}
                  to={`/devices/${device.id}`}
                  className="glass-card group cursor-pointer overflow-hidden animate-fade-up"
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
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-text-primary group-hover:text-primary-400 transition-colors truncate">
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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
