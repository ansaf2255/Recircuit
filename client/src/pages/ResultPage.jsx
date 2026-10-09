import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineRefresh, HiOutlineShoppingCart, HiOutlineCog, HiOutlineTrash, HiOutlineArrowRight, HiOutlineArrowLeft } from 'react-icons/hi';

const resultConfig = {
  reuse: {
    icon: HiOutlineCheckCircle,
    title: 'Ready to Reuse',
    description: 'This device is in great condition and can be used as-is!',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700',
    border: 'border-emerald-500/20',
  },
  resell: {
    icon: HiOutlineShoppingCart,
    title: 'Ready to Resell',
    description: 'Minor issues only — this device has great resale value.',
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-700',
    border: 'border-cyan-500/20',
  },
  refurbish: {
    icon: HiOutlineCog,
    title: 'Needs Refurbishment',
    description: 'This device needs some repairs but is worth fixing.',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700',
    border: 'border-amber-500/20',
  },
  recycle: {
    icon: HiOutlineTrash,
    title: 'Recycle Responsibly',
    description: 'This device should be recycled to recover valuable materials.',
    gradient: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-500/10',
    text: 'text-rose-700',
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

  const [hasAssessedComponents, setHasAssessedComponents] = useState(false);

  useEffect(() => {
    loadData();
  }, [deviceId]);

  const loadData = async () => {
    try {
      const [deviceRes, classRes, compResultsRes] = await Promise.all([
        api.get(`/devices/${deviceId}`),
        api.get(`/questionnaire/${deviceId}`),
        api.get(`/components/${deviceId}/results`).catch(() => ({ data: [] }))
      ]);
      setDevice(deviceRes.data);
      setClassification(classRes.data);
      setHasAssessedComponents(compResultsRes.data.length > 0);

      const compRes = await api.get(`/categories/${deviceRes.data.category_id}/components`);
      setComponents(compRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = () => {
    navigate(`/devices/${deviceId}/match`);
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
      <div className="page-container max-w-2xl text-center">
        <p className="text-text-secondary">No classification found.</p>
        <Link to={`/devices/${deviceId}/questionnaire`} className="text-primary-400 mt-4 inline-block font-medium">
          Take the assessment →
        </Link>
      </div>
    );
  }

  const config = resultConfig[classification.result] || resultConfig.recycle;
  const Icon = config.icon;

  return (
    <div className="page-container max-w-2xl relative">
      <div className="glow-orb w-[400px] h-[400px] bg-primary-600/8 top-0 left-[50%] -translate-x-1/2" />

      {/* Back link */}
      <Link to={`/devices/${deviceId}`} className="text-text-muted hover:text-text-secondary text-sm flex items-center gap-1.5 mb-6 relative z-10">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to device
      </Link>

      {/* Result Card */}
      <div className="glass-card p-8 sm:p-10 text-center mb-6 relative z-10 animate-fade-up">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center mx-auto mb-6 pulse-glow`}>
          <Icon className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-2 tracking-tight">{config.title}</h1>
        <p className="text-text-secondary mb-6 max-w-sm mx-auto">{config.description}</p>

        <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${config.bg} border ${config.border}`}>
          <span className={`text-sm font-bold uppercase tracking-wide ${config.text}`}>
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
      <div className="glass-card p-6 sm:p-8 mb-6 relative z-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-lg font-bold text-text-primary mb-3">Assessment Reasoning</h2>
        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface/60 p-4 rounded-xl leading-relaxed">
          {classification.reasoning}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 relative z-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
        {components.length > 0 && classification.result !== 'recycle' && (
          <Link to={hasAssessedComponents ? `/devices/${deviceId}/components/results` : `/devices/${deviceId}/components`} className="btn-ghost flex-1 !py-3">
            <HiOutlineCog className="w-5 h-5" />
            {hasAssessedComponents ? 'View Component Results' : 'Assess Components (Optional)'}
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        )}

        {components.length > 0 && classification.result === 'recycle' && !hasAssessedComponents && (
          <Link
            to={`/devices/${deviceId}/components`}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-rose-500/25 animate-pulse"
          >
            <HiOutlineCog className="w-5 h-5" />
            Required: Assess Components
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        )}
        
        {components.length > 0 && classification.result === 'recycle' && hasAssessedComponents && (
          <Link to={`/devices/${deviceId}/components/results`} className="btn-ghost flex-1 !py-3">
            <HiOutlineCog className="w-5 h-5" />
            View Component Results
            <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        )}

        {(classification.result !== 'recycle' || hasAssessedComponents) && (
          <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-2xl bg-surface-lighter border border-border/50">
            <span className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              Waiting for a partner to claim this device...
            </span>
            <p className="text-xs text-text-muted mt-1 text-center">
              Check your Requests tab for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
