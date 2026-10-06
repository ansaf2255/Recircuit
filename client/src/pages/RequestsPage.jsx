import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCheck, HiOutlineLocationMarker } from 'react-icons/hi';

const statusConfig = {
  pending:   { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: HiOutlineClock, label: 'Pending' },
  accepted:  { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: HiOutlineCheck, label: 'Accepted' },
  completed: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: HiOutlineCheckCircle, label: 'Completed' },
  cancelled: { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: HiOutlineXCircle, label: 'Cancelled' },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, status) => {
    try {
      await api.patch(`/requests/${requestId}`, { status });
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <div className="glow-orb w-[350px] h-[350px] bg-primary-600/8 -top-[50px] -right-[100px]" />

      <div className="page-header relative z-10 animate-fade-up">
        <h1 className="page-title gradient-text">Request Tracking</h1>
        <p className="page-subtitle">
          {user.role === 'seller' ? 'Track your device pickup requests' : 'Manage incoming device requests'}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="glass-card p-14 text-center relative z-10 animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-surface-lighter flex items-center justify-center mx-auto mb-4">
            <HiOutlineClock className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">No requests yet</h2>
          <p className="text-text-secondary text-sm max-w-sm mx-auto">
            {user.role === 'seller'
              ? 'Submit a device for assessment and matching to create requests.'
              : 'Requests will appear here when devices are matched to you.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {requests.map((req, i) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const reusableParts = req.components?.filter(c => c.result === 'reusable') || [];
            const recycleParts = req.components?.filter(c => c.result === 'recycle') || [];

            return (
              <div key={req.id} className="glass-card overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  {req.image_url && (
                    <div className="w-full lg:w-40 h-36 lg:h-auto overflow-hidden flex-shrink-0">
                      <img src={req.image_url} alt={req.model} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                    <div>
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-bold text-text-primary text-lg leading-tight">
                          {req.brand} {req.model}
                        </h3>
                        <span className={`badge flex-shrink-0 ${config.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-text-muted mb-2">
                        <span>{req.category_name}</span>
                        {req.classification && (
                          <span className="capitalize">• {req.classification}</span>
                        )}
                        {req.device_location && (
                          <span className="flex items-center gap-1">
                            <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                            {req.device_location}
                          </span>
                        )}
                      </div>

                      {/* Partner / Seller */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary mb-2">
                        {req.partner_name && <span>Partner: <strong className="text-text-primary">{req.partner_name}</strong></span>}
                        {req.seller_name && <span>Seller: <strong className="text-text-primary">{req.seller_name}</strong></span>}
                      </div>

                      {req.description && (
                        <p className="text-sm text-text-muted italic line-clamp-1 mb-3">"{req.description}"</p>
                      )}

                      {/* Components Breakdown */}
                      {(reusableParts.length > 0 || recycleParts.length > 0) && (user.role === 'recycler' || user.role === 'refurbisher' || user.role === 'admin') && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {reusableParts.length > 0 && (
                            <span className="badge !border-emerald-500/20 bg-emerald-500/8 text-emerald-400">
                              ✓ Reusable: {reusableParts.map(c => c.component_name).join(', ')}
                            </span>
                          )}
                          {recycleParts.length > 0 && (
                            <span className="badge !border-rose-500/20 bg-rose-500/8 text-rose-400">
                              ♻ Recycle: {recycleParts.map(c => c.component_name).join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {(user.role === 'recycler' || user.role === 'refurbisher') && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(req.id, 'accepted')}
                              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-all duration-200"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateStatus(req.id, 'cancelled')}
                              className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold hover:bg-rose-500/20 transition-all duration-200"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => updateStatus(req.id, 'completed')}
                            className="btn-primary"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
