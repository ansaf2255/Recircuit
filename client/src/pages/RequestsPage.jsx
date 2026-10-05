import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { HiOutlineClock, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCheck } from 'react-icons/hi';

const statusConfig = {
  pending: { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: HiOutlineClock, label: 'Pending' },
  accepted: { color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', icon: HiOutlineCheck, label: 'Accepted' },
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Request Tracking</h1>
        <p className="text-text-secondary mt-1">
          {user.role === 'seller' ? 'Track your device pickup requests' : 'Manage incoming device requests'}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <HiOutlineClock className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No requests yet</h2>
          <p className="text-text-secondary">
            {user.role === 'seller'
              ? 'Submit a device for assessment and matching to create requests.'
              : 'Requests will appear here when devices are matched to you.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            
            const reusableParts = req.components?.filter(c => c.result === 'reusable') || [];
            const recycleParts = req.components?.filter(c => c.result === 'recycle') || [];

            return (
              <div key={req.id} className="glass-card p-5">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Device Info & Image */}
                  <div className="flex-1 flex flex-col md:flex-row gap-4">
                    {req.image_url && (
                      <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden bg-surface flex-shrink-0">
                        <img src={req.image_url} alt={req.model} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-text-primary text-lg">
                          {req.brand} {req.model}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {config.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted mb-2">
                        <span>Category: {req.category_name}</span>
                        {req.classification && (
                          <span className="capitalize">Classification: {req.classification}</span>
                        )}
                        {req.device_location && <span>Location: {req.device_location}</span>}
                        {req.partner_name && <span>Partner: {req.partner_name}</span>}
                        {req.seller_name && <span>Seller: {req.seller_name}</span>}
                      </div>
                      {req.description && (
                        <p className="text-sm text-text-secondary line-clamp-2 italic mb-2">"{req.description}"</p>
                      )}
                      
                      {/* Components Breakdown */}
                      {(reusableParts.length > 0 || recycleParts.length > 0) && (user.role === 'recycler' || user.role === 'refurbisher') && (
                        <div className="mt-3 flex gap-4 text-xs">
                          {reusableParts.length > 0 && (
                            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                              <span className="font-semibold">Reusable ({reusableParts.length}):</span> {reusableParts.map(c => c.component_name).join(', ')}
                            </div>
                          )}
                          {recycleParts.length > 0 && (
                            <div className="bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20">
                              <span className="font-semibold">Recycle ({recycleParts.length}):</span> {recycleParts.map(c => c.component_name).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                    {(user.role === 'recycler' || user.role === 'refurbisher') && req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(req.id, 'accepted')}
                          className="w-full px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/20 transition-all"
                        >
                          Accept Request
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'cancelled')}
                          className="w-full px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-500/20 transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {(user.role === 'recycler' || user.role === 'refurbisher') && req.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(req.id, 'completed')}
                        className="w-full px-4 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl text-sm font-medium hover:bg-primary-500/20 transition-all"
                      >
                        Mark Complete
                      </button>
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
