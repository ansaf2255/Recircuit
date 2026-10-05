import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineRefresh, HiOutlineShoppingCart, HiOutlineCog, HiOutlineTrash, HiOutlineArrowRight } from 'react-icons/hi';

const resultConfig = {
  reuse: {
    icon: HiOutlineCheckCircle,
    title: 'Ready to Reuse',
    description: 'This device is in great condition and can be used as-is!',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  resell: {
    icon: HiOutlineShoppingCart,
    title: 'Ready to Resell',
    description: 'Minor issues only — this device has great resale value.',
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  refurbish: {
    icon: HiOutlineCog,
    title: 'Needs Refurbishment',
    description: 'This device needs some repairs but is worth fixing.',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  recycle: {
    icon: HiOutlineTrash,
    title: 'Recycle Responsibly',
    description: 'This device should be recycled to recover valuable materials.',
    gradient: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
};

export default function ResultPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [classification, setClassification] = useState(null);
  const [device, setDevice] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      const [deviceRes, classRes] = await Promise.all([
        api.get(`/devices/${deviceId}`),
        api.get(`/questionnaire/${deviceId}`),
      ]);
      setDevice(deviceRes.data);
      setClassification(classRes.data);

      // Check if components exist for this category
      const compRes = await api.get(`/categories/${deviceRes.data.category_id}/components`);
      setComponents(compRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    try {
      await api.post(`/matches/${deviceId}`);
      navigate('/requests');
    } catch (err) {
      alert(err.response?.data?.error || 'Matching failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!classification) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-text-secondary">No classification found.</p>
        <Link to={`/devices/${deviceId}/questionnaire`} className="text-primary-400 mt-4 inline-block">
          Take the assessment →
        </Link>
      </div>
    );
  }

  const config = resultConfig[classification.result] || resultConfig.recycle;
  const Icon = config.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Result Card */}
      <div className="glass-card p-8 text-center mb-6">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto mb-6 pulse-glow`}>
          <Icon className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-2">{config.title}</h1>
        <p className="text-text-secondary mb-6">{config.description}</p>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${config.bg} border ${config.border}`}>
          <span className={`text-sm font-semibold uppercase ${config.text}`}>
            {classification.result}
          </span>
          {classification.score !== null && (
            <span className="text-text-muted text-sm">
              — Score: {classification.score}
            </span>
          )}
        </div>
      </div>

      {/* Reasoning */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-3">Assessment Reasoning</h2>
        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface p-4 rounded-xl">
          {classification.reasoning}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {components.length > 0 && (
          <Link
            to={`/devices/${deviceId}/components`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25"
          >
            <HiOutlineCog className="w-5 h-5" />
            Assess Components
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        )}

        <button
          onClick={handleMatch}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/25"
        >
          <HiOutlineRefresh className="w-5 h-5" />
          Find a Match
        </button>
      </div>
    </div>
  );
}
