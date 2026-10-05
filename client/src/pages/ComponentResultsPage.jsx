import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';

export default function ComponentResultsPage() {
  const { deviceId } = useParams();
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

  const reusableCount = results.filter((r) => r.result === 'reusable').length;
  const recycleCount = results.filter((r) => r.result === 'recycle').length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to={`/devices/${deviceId}/result`} className="text-text-muted hover:text-text-secondary text-sm flex items-center gap-1 mb-4">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to device result
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">Component Breakdown</h1>
        <p className="text-text-secondary mt-1">
          {device?.brand} {device?.model} — Individual component assessment
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-3">
            <HiOutlineCheckCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{reusableCount}</p>
          <p className="text-sm text-text-muted">Reusable</p>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mx-auto mb-3">
            <HiOutlineTrash className="w-6 h-6 text-white" />
          </div>
          <p className="text-2xl font-bold text-rose-400">{recycleCount}</p>
          <p className="text-sm text-text-muted">Recycle</p>
        </div>
      </div>

      {/* Reusable Parts */}
      {results.filter(r => r.result === 'reusable').length > 0 && (
        <div className="glass-card overflow-hidden mb-6 border-emerald-500/20">
          <div className="bg-emerald-500/10 px-6 py-3 border-b border-emerald-500/20">
            <h2 className="text-emerald-400 font-semibold flex items-center gap-2">
              <HiOutlineCheckCircle className="w-5 h-5" />
              Reusable Parts
            </h2>
          </div>
          <table className="w-full">
            <tbody>
              {results.filter(r => r.result === 'reusable').map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-surface-light/50 transition-colors">
                  <td className="py-4 px-6 w-1/3">
                    <span className="font-medium text-text-primary">{r.component_name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-text-muted">{r.reasoning?.split('\n')[0]}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recycle Parts */}
      {results.filter(r => r.result === 'recycle').length > 0 && (
        <div className="glass-card overflow-hidden border-rose-500/20">
          <div className="bg-rose-500/10 px-6 py-3 border-b border-rose-500/20">
            <h2 className="text-rose-400 font-semibold flex items-center gap-2">
              <HiOutlineTrash className="w-5 h-5" />
              Recycle / Material Recovery Parts
            </h2>
          </div>
          <table className="w-full">
            <tbody>
              {results.filter(r => r.result === 'recycle').map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-surface-light/50 transition-colors">
                  <td className="py-4 px-6 w-1/3">
                    <span className="font-medium text-text-primary">{r.component_name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-text-muted">{r.reasoning?.split('\n')[0]}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back to match */}
      <div className="mt-6 text-center">
        <Link
          to={`/devices/${deviceId}/result`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-primary-500/25"
        >
          Back to Results
        </Link>
      </div>
    </div>
  );
}
