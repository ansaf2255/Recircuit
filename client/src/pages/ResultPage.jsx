import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineRefresh, HiOutlineShoppingCart, HiOutlineCog, HiOutlineTrash, HiOutlineArrowRight, HiOutlineArrowLeft } from 'react-icons/hi';

const resultConfig = {
  reuse: {
    icon: HiOutlineCheckCircle,
    title: 'Ready for Direct Reuse',
    description: 'Hardware passed diagnostic tests with high operational integrity. Suitable for immediate redeployment.',
    iconBox: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  resell: {
    icon: HiOutlineShoppingCart,
    title: 'Commercial Resale Viability',
    description: 'Diagnostic assessment confirms hardware operational integrity. Suitable for verified refurbished marketplace listing.',
    iconBox: 'bg-blue-50 text-blue-700 border border-blue-200',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  refurbish: {
    icon: HiOutlineCog,
    title: 'Refurbishment Required',
    description: 'Hardware displays repairable screen or chassis flaws. Requires certified parts refurbishment before resale.',
    iconBox: 'bg-amber-50 text-amber-700 border border-amber-200',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  recycle: {
    icon: HiOutlineTrash,
    title: 'Certified Material Recovery',
    description: 'Device integrity or safety thresholds recommend modular component harvesting and responsible metals recycling.',
    iconBox: 'bg-rose-50 text-rose-700 border border-rose-200',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
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
    <div className="page-container max-w-2xl">
      {/* Back link */}
      <Link to={`/devices/${deviceId}`} className="text-text-muted hover:text-text-secondary text-xs flex items-center gap-1.5 mb-5 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to device listing
      </Link>

      {/* Result Card */}
      <div className="glass-card p-8 sm:p-10 text-center mb-6 bg-white border border-border shadow-xs animate-fade-up">
        <div className={`w-16 h-16 rounded-2xl ${config.iconBox} flex items-center justify-center mx-auto mb-5 shadow-xs`}>
          <Icon className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2 tracking-tight">{config.title}</h1>
        <p className="text-text-secondary text-xs sm:text-sm mb-5 max-w-md mx-auto leading-relaxed">{config.description}</p>

        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full ${config.badge}`}>
          <span className="text-xs font-bold uppercase tracking-wider">
            {classification.result}
          </span>
          {classification.score !== null && (
            <span className="text-xs opacity-80">
              • Diagnostic Score: {classification.score}/100
            </span>
          )}
        </div>
      </div>

      {/* Reasoning */}
      <div className="glass-card p-6 sm:p-8 mb-6 relative z-10 animate-fade-up">
        <h2 className="text-lg font-bold text-text-primary mb-3">Assessment Reasoning</h2>
        <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono bg-surface p-4 rounded-xl leading-relaxed border border-border">
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
            className="btn-primary flex-1 !py-3 justify-center !bg-rose-700 hover:!bg-rose-800"
          >
            <HiOutlineCog className="w-5 h-5" />
            Assess Salvage Components (Required)
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
          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleMatch}
              className="btn-primary flex-1 !py-3 w-full justify-center cursor-pointer"
            >
              Find Nearby Partner <HiOutlineArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/marketplace"
              className="btn-ghost flex-1 !py-3 w-full justify-center"
            >
              Explore Marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
