import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { HiOutlineUser, HiOutlineLocationMarker, HiOutlineCheckCircle, HiOutlineArrowLeft } from 'react-icons/hi';

export default function MatchPage() {
  const { addToast } = useToast();
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, [deviceId]);

  const loadCandidates = async () => {
    try {
      const res = await api.get(`/matches/${deviceId}/candidates`);
      setCandidates(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load candidates.');
    } finally {
      setLoading(false);
    }
  };

  const selectPartner = async (partnerId) => {
    setMatching(true);
    try {
      await api.post(`/matches/${deviceId}`, { partner_id: partnerId });
      navigate('/requests');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to match.');
      setMatching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container max-w-2xl text-center">
        <div className="glass-card p-10">
          <p className="text-rose-400 mb-4">{error}</p>
          <Link to={`/devices/${deviceId}/result`} className="text-primary-400 hover:text-primary-300 font-medium text-sm">
            ← Back to Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl relative">
      <div className="glow-orb w-[350px] h-[350px] bg-primary-600/10 -top-[50px] -right-[100px]" />

      <div className="page-header relative z-10 animate-fade-up">
        <Link to={`/devices/${deviceId}/result`} className="text-text-muted hover:text-text-secondary text-sm flex items-center gap-1.5 mb-4">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to device result
        </Link>
        <h1 className="page-title gradient-text">Select a Partner</h1>
        <p className="page-subtitle">Choose a verified recycler or refurbisher to handle your device.</p>
      </div>

      <div className="space-y-4 relative z-10">
        {candidates.map((partner, i) => (
          <div
            key={partner.id}
            className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-fade-up"
            style={{ animationDelay: `${(i + 1) * 60}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {partner.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  {partner.name}
                  <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" title="Verified Partner" />
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineUser className="w-3.5 h-3.5" />
                    <span className="capitalize">{partner.role}</span>
                  </span>
                  {partner.location && (
                    <span className="flex items-center gap-1.5">
                      <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                      {partner.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => selectPartner(partner.id)}
              disabled={matching}
              className="btn-primary w-full sm:w-auto flex-shrink-0"
            >
              Select Partner
            </button>
          </div>
        ))}

        {candidates.length === 0 && (
          <div className="glass-card p-12 text-center animate-fade-up">
            <div className="w-16 h-16 rounded-2xl bg-surface-lighter flex items-center justify-center mx-auto mb-4">
              <HiOutlineUser className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-lg font-bold text-text-primary mb-2">No partners available</h2>
            <p className="text-text-secondary text-sm">No verified partners found for your device at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
