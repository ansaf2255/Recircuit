import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineArrowRight, HiOutlineLocationMarker } from 'react-icons/hi';

const classColors = {
  reuse: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  resell: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  refurbish: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  recycle: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [classification, setClassification] = useState(null);
  const [componentResults, setComponentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      const deviceRes = await api.get(`/devices/${deviceId}`);
      setDevice(deviceRes.data);

      try {
        const classRes = await api.get(`/questionnaire/${deviceId}`);
        setClassification(classRes.data);
      } catch {}

      try {
        const compRes = await api.get(`/components/${deviceId}/results`);
        setComponentResults(compRes.data);
      } catch {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!device) return <p className="text-center text-text-secondary py-8">Device not found.</p>;

  return (
    <div className="page-container max-w-3xl relative">
      <div className="glow-orb w-[350px] h-[350px] bg-primary-600/8 top-0 right-0" />

      <div className="glass-card overflow-hidden relative z-10 animate-fade-up">
        {/* Hero image */}
        {device.image_url && (
          <div className="w-full h-60 overflow-hidden">
            <img src={device.image_url} alt={device.model} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{device.brand} {device.model}</h1>
              <p className="text-text-muted text-sm mt-1">{device.category_name}</p>
            </div>
            {classification && (
              <span className={`badge capitalize ${classColors[classification.result] || ''}`}>
                {classification.result}
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="space-y-2 mb-6">
            {device.description && (
              <p className="text-text-secondary text-sm leading-relaxed">{device.description}</p>
            )}
            {device.location && (
              <p className="text-sm text-text-muted flex items-center gap-1.5">
                <HiOutlineLocationMarker className="w-4 h-4" /> {device.location}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!classification && (
              <Link to={`/devices/${deviceId}/questionnaire`} className="btn-primary">
                Start Assessment <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            )}
            {classification && (
              <Link to={`/devices/${deviceId}/result`} className="btn-primary">
                View Results <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Component Results */}
      {componentResults.length > 0 && (
        <div className="glass-card mt-6 p-6 sm:p-8 relative z-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h2 className="text-lg font-bold text-text-primary mb-4">Component Breakdown</h2>
          <div className="space-y-2">
            {componentResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-surface-light/60">
                <span className="text-text-primary text-sm font-medium">{r.component_name}</span>
                <span className={`badge capitalize ${r.result === 'reusable' ? classColors.reuse : classColors.recycle}`}>
                  {r.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
