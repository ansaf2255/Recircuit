import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

export default function ComponentResultsPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      const [deviceRes, resultsRes] = await Promise.all([
        api.get(`/devices/${deviceId}`),
        api.get(`/components/${deviceId}/results`),
      ]);
      setDevice(deviceRes.data);
      setResults(resultsRes.data);
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

  const reusable = results.filter((r) => r.result === 'reusable');
  const recycle = results.filter((r) => r.result === 'recycle');

  return (
    <div className="page-container max-w-2xl relative">
      <div className="glow-orb w-[350px] h-[350px] bg-cyan-500/8 -top-[50px] -right-[100px]" />

      {/* Header */}
      <div className="page-header relative z-10 animate-fade-up">
        <Link to={`/devices/${deviceId}/result`} className="text-text-muted hover:text-text-secondary text-sm flex items-center gap-1.5 mb-4">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to device result
        </Link>
        <h1 className="page-title text-text-primary">Component Breakdown</h1>
        <p className="page-subtitle">
          {device?.brand} {device?.model} — Individual component assessment
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
        <div className="glass-card p-6 text-center animate-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
            <HiOutlineCheckCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{reusable.length}</p>
          <p className="text-sm text-text-muted mt-1">Reusable Parts</p>
        </div>
        <div className="glass-card p-6 text-center animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mx-auto mb-3">
            <HiOutlineTrash className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-rose-600">{recycle.length}</p>
          <p className="text-sm text-text-muted mt-1">Recycle Parts</p>
        </div>
      </div>

      {/* Reusable Parts */}
      {reusable.length > 0 && (
        <div className="glass-card overflow-hidden mb-6 !border-emerald-500/15 relative z-10 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <div className="bg-emerald-500/8 px-6 py-3.5 border-b border-emerald-500/15">
            <h2 className="text-emerald-700 font-bold flex items-center gap-2 text-sm">
              <HiOutlineCheckCircle className="w-5 h-5" />
              Reusable Parts
            </h2>
          </div>
          <div className="divide-y divide-border/40">
            {reusable.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-4 px-6 hover:bg-surface-light/30 transition-colors">
                <span className="font-medium text-text-primary text-sm">{r.component_name}</span>
                <span className="text-xs text-text-muted max-w-[50%] text-right">{r.reasoning?.split('\n')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recycle Parts */}
      {recycle.length > 0 && (
        <div className="glass-card overflow-hidden mb-8 !border-rose-500/15 relative z-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="bg-rose-500/8 px-6 py-3.5 border-b border-rose-500/15">
            <h2 className="text-rose-700 font-bold flex items-center gap-2 text-sm">
              <HiOutlineTrash className="w-5 h-5" />
              Recycle / Material Recovery
            </h2>
          </div>
          <div className="divide-y divide-border/40">
            {recycle.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-4 px-6 hover:bg-surface-light/30 transition-colors">
                <span className="font-medium text-text-primary text-sm">{r.component_name}</span>
                <span className="text-xs text-text-muted max-w-[50%] text-right">{r.reasoning?.split('\n')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <Link to={`/devices/${deviceId}/result`} className="btn-primary flex-1 !py-3">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Results
        </Link>
      </div>
    </div>
  );
}
