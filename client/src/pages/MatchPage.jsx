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
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-rose-400 mb-4">{error}</p>
        <Link to={`/devices/${deviceId}/result`} className="text-primary-400 hover:text-primary-300">
          ← Back to Results
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to={`/devices/${deviceId}/result`} className="text-text-muted hover:text-text-secondary text-sm flex items-center gap-1 mb-4">
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to device result
        </Link>
        <h1 className="text-3xl font-bold gradient-text">Select a Partner</h1>
        <p className="text-text-secondary mt-1">
          Choose a verified recycler or refurbisher to handle your device.
        </p>
      </div>

      <div className="space-y-4">
        {candidates.map((partner) => (
          <div key={partner.id} className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                {partner.name}
                <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" title="Verified Partner" />
              </h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <HiOutlineUser className="w-4 h-4" />
                  <span className="capitalize">{partner.role}</span>
                </span>
                {partner.location && (
                  <span className="flex items-center gap-1">
                    <HiOutlineLocationMarker className="w-4 h-4" />
                    {partner.location}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => selectPartner(partner.id)}
              disabled={matching}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
            >
              Select
            </button>
          </div>
        ))}

        {candidates.length === 0 && (
          <div className="glass-card p-8 text-center text-text-secondary">
            No verified partners found for your device at this time.
          </div>
        )}
      </div>
    </div>
  );
}
