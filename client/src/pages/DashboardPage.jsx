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

  // Stats
  const total = devices.length;
  const classified = devices.filter((d) => d.classification).length;
  const reusable = devices.filter((d) => ['reuse', 'resell', 'refurbish'].includes(d.classification)).length;
  const recycled = devices.filter((d) => d.classification === 'recycle').length;

  const stats = [
    { label: 'Total Devices', value: total, icon: HiOutlineChartBar, color: 'from-primary-500 to-primary-600' },
    { label: 'Classified', value: classified, icon: HiOutlineCheckCircle, color: 'from-emerald-500 to-emerald-600' },
    { label: 'Diverted', value: reusable, icon: HiOutlineRefresh, color: 'from-cyan-500 to-cyan-600' },
    { label: 'Recycled', value: recycled, icon: HiOutlineTrash, color: 'from-rose-500 to-rose-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Welcome back, <span className="gradient-text">{user.name}</span>
          </h1>
          <p className="text-text-secondary mt-1">
            {user.role === 'seller'
              ? 'Manage your listed devices and track their journey'
              : 'View incoming devices and manage requests'}
          </p>
        </div>
        {user.role === 'seller' && (
          <Link
            to="/devices/new"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            List Device
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Device Grid */}
      {devices.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineDeviceMobile className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No devices yet</h2>
          <p className="text-text-secondary mb-6">Start by listing your first electronic device for assessment.</p>
          {user.role === 'seller' && (
            <Link
              to="/devices/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl transition-all"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              List Your First Device
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const Icon = categoryIcons[device.category_name] || HiOutlineDeviceMobile;
            return (
              <Link
                key={device.id}
                to={`/devices/${device.id}`}
                className="glass-card p-5 group cursor-pointer"
              >
                {/* Image or placeholder */}
                <div className="w-full h-40 rounded-xl bg-surface-lighter mb-4 overflow-hidden flex items-center justify-center">
                  {device.image_url ? (
                    <img src={device.image_url} alt={device.model || 'Device'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Icon className="w-16 h-16 text-text-muted" />
                  )}
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-primary-400 transition-colors">
                      {device.brand} {device.model}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">{device.category_name}</p>
                    {device.location && (
                      <p className="text-xs text-text-muted mt-1">📍 {device.location}</p>
                    )}
                  </div>
                  {device.classification && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border capitalize ${classColors[device.classification] || ''}`}>
                      {device.classification}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
