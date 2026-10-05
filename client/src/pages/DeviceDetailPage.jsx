import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineArrowRight } from 'react-icons/hi';

const classColors = {
  reuse: 'text-emerald-400',
  resell: 'text-cyan-400',
  refurbish: 'text-amber-400',
  recycle: 'text-rose-400',
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="glass-card overflow-hidden">
        {device.image_url && (
          <div className="w-full h-56 overflow-hidden">
            <img src={device.image_url} alt={device.model} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">{device.brand} {device.model}</h1>
              <p className="text-text-muted">{device.category_name}</p>
            </div>
            {classification && (
              <span className={`text-sm font-bold uppercase ${classColors[classification.result]}`}>
                {classification.result}
              </span>
            )}
          </div>

          {device.description && (
            <p className="text-text-secondary mb-4">{device.description}</p>
          )}
          {device.location && (
            <p className="text-sm text-text-muted mb-6">📍 {device.location}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {!classification && (
              <Link
                to={`/devices/${deviceId}/questionnaire`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl text-sm"
              >
                Start Assessment <HiOutlineArrowRight />
              </Link>
            )}
            {classification && (
              <Link
                to={`/devices/${deviceId}/result`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl text-sm"
              >
                View Results <HiOutlineArrowRight />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Component Results if available */}
      {componentResults.length > 0 && (
        <div className="glass-card mt-6 p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Component Breakdown</h2>
          <div className="space-y-2">
            {componentResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-light">
                <span className="text-text-primary text-sm">{r.component_name}</span>
                <span className={`text-sm font-medium capitalize ${r.result === 'reusable' ? 'text-emerald-400' : 'text-rose-400'}`}>
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
