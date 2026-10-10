import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  HiOutlineClock, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineCheck, 
  HiOutlineLocationMarker, 
  HiOutlineDocumentDownload,
  HiOutlineDeviceMobile,
  HiOutlineChip,
  HiOutlineMail,
  HiOutlineTruck,
  HiOutlineInbox
} from 'react-icons/hi';

const statusConfig = {
  pending:    { color: 'text-amber-800 bg-amber-50 border-amber-200', icon: HiOutlineClock, label: 'Pending' },
  accepted:   { color: 'text-blue-800 bg-blue-50 border-blue-200', icon: HiOutlineCheck, label: 'Accepted' },
  completed:  { color: 'text-emerald-800 bg-emerald-50 border-emerald-200', icon: HiOutlineCheckCircle, label: 'Completed' },
  cancelled:  { color: 'text-rose-800 bg-rose-50 border-rose-200', icon: HiOutlineXCircle, label: 'Cancelled' },
  claimed:    { color: 'text-amber-800 bg-amber-50 border-amber-200', icon: HiOutlineClock, label: 'Order Claimed' },
  dispatched: { color: 'text-blue-800 bg-blue-50 border-blue-200', icon: HiOutlineTruck, label: 'Dispatched / In Transit' },
  delivered:  { color: 'text-emerald-800 bg-emerald-50 border-emerald-200', icon: HiOutlineCheckCircle, label: 'Delivered' },
};

export default function RequestsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('devices');
  const [requests, setRequests] = useState([]);
  const [componentOrders, setComponentOrders] = useState([]);
  const [incomingComponentOrders, setIncomingComponentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [reqRes, ordersRes, incomingRes] = await Promise.all([
        api.get('/requests').catch(() => ({ data: [] })),
        user?.role !== 'recycler' ? api.get('/components/my-orders').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        user?.role === 'seller' ? api.get('/components/incoming-orders').catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setRequests(reqRes.data || []);
      setComponentOrders(user?.role !== 'recycler' ? (ordersRes.data || []) : []);
      setIncomingComponentOrders(user?.role === 'seller' ? (incomingRes.data || []) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      await api.patch(`/requests/${requestId}`, { status });
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateComponentStatus = async (componentId, status) => {
    try {
      await api.patch(`/components/${componentId}/order-status`, { status });
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container relative">
      <div className="page-header relative z-10 animate-fade-up">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="page-title text-text-primary">
              {user.role === 'recycler' ? 'E-Waste Pickup & Logistics' : 'Order & Logistics Hub'}
            </h1>
            <p className="page-subtitle">
              {user.role === 'recycler'
                ? 'Manage designated e-waste pickups, claim fulfillment, and certified recycling batches'
                : 'Manage whole-device pickups, incoming salvage sales, and harvested component orders'}
            </p>
          </div>

          {/* Google MD3 Tab Stepper (Consumers & Refurbishers only) */}
          {user.role !== 'recycler' && (
            <div className="inline-flex p-1 bg-surface-lighter border border-border rounded-full shadow-xs self-start lg:self-center overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveTab('devices')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'devices'
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <HiOutlineDeviceMobile className="w-4 h-4" />
                Device Pickups ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab('purchased_parts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'purchased_parts'
                    ? 'bg-primary-700 text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <HiOutlineChip className="w-4 h-4" />
                Purchased Parts ({componentOrders.length})
              </button>
              {user.role === 'seller' && (
                <button
                  onClick={() => setActiveTab('incoming_parts')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'incoming_parts'
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <HiOutlineInbox className="w-4 h-4" />
                  Sold Parts Orders ({incomingComponentOrders.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= TAB 1: DEVICE REQUESTS ================= */}
      {activeTab === 'devices' && (
        requests.length === 0 ? (
          <div className="glass-card p-14 text-center bg-white animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
              <HiOutlineClock className="w-7 h-7 text-text-muted" />
            </div>
            <h2 className="text-base font-bold text-text-primary mb-1">No active device pickups</h2>
            <p className="text-text-secondary text-xs max-w-sm mx-auto mb-5">
              Submit a device for assessment or claim an available device from the regional marketplace.
            </p>
            <Link to="/marketplace" className="btn-primary !text-xs !py-2.5">
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req, i) => {
              const config = statusConfig[req.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const reusableParts = req.components?.filter(c => c.result === 'reusable') || [];
              const recycleParts = req.components?.filter(c => c.result === 'recycle') || [];

              return (
                <div key={req.id} className="glass-card overflow-hidden bg-white animate-fade-up border border-border" style={{ animationDelay: `${i * 30}ms` }}>
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    {req.images && req.images.length > 0 && (
                      <div className="w-full md:w-48 h-40 md:h-auto overflow-hidden flex-shrink-0 bg-surface">
                        <img src={req.images[0]} alt={req.model} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="text-[11px] uppercase font-semibold text-text-muted tracking-wider">
                              {req.category_name}
                            </div>
                            <h3 className="font-bold text-text-primary text-base leading-tight mt-0.5">
                              {req.brand} {req.model}
                            </h3>
                          </div>
                          <span className={`badge flex-shrink-0 ${config.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {config.label}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
                          {req.classification && (
                            <span className="capitalize font-semibold text-text-primary">
                              Outcome: {req.classification}
                            </span>
                          )}
                          {req.device_location && (
                            <span className="flex items-center gap-1">
                              <HiOutlineLocationMarker className="w-3.5 h-3.5 text-text-muted" />
                              {req.device_location}
                            </span>
                          )}
                        </div>

                        {/* Partner / Seller Contact Box */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-secondary mb-3 p-3 bg-surface rounded-xl border border-border">
                          {req.partner_name && (
                            <div>
                              <span className="text-text-muted">Matched Partner: </span>
                              <strong className="text-text-primary font-medium">{req.partner_name}</strong>
                              {req.partner_email && (
                                <a href={`mailto:${req.partner_email}`} className="ml-1 text-primary-700 hover:underline">
                                  ({req.partner_email})
                                </a>
                              )}
                            </div>
                          )}
                          {req.seller_name && (
                            <div>
                              <span className="text-text-muted">Device Owner: </span>
                              <strong className="text-text-primary font-medium">{req.seller_name}</strong>
                              {req.seller_email && (
                                <a href={`mailto:${req.seller_email}`} className="ml-1 text-primary-700 hover:underline">
                                  ({req.seller_email})
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {req.description && (
                          <p className="text-xs text-text-muted italic line-clamp-2 mb-3">"{req.description}"</p>
                        )}

                        {/* Components Breakdown */}
                        {(reusableParts.length > 0 || recycleParts.length > 0) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {reusableParts.length > 0 && (
                              <span className="badge border-emerald-200 bg-emerald-50 text-emerald-800 font-medium">
                                ✓ Reusable: {reusableParts.map(c => c.component_name).join(', ')}
                              </span>
                            )}
                            {recycleParts.length > 0 && (
                              <span className="badge border-rose-200 bg-rose-50 text-rose-800 font-medium">
                                ♻ Material Recovery: {recycleParts.map(c => c.component_name).join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        {req.status === 'pending' && user.id === req.seller_id && (
                          <>
                            <button
                              onClick={() => updateRequestStatus(req.id, 'accepted')}
                              className="px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Accept Pickup Request
                            </button>
                            <button
                              onClick={() => updateRequestStatus(req.id, 'cancelled')}
                              className="px-4 py-2 bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        {req.status === 'accepted' && (
                          <button
                            onClick={() => updateRequestStatus(req.id, 'completed')}
                            className="btn-primary !text-xs !py-2 cursor-pointer"
                          >
                            Mark Completed & Issue Certificate
                          </button>
                        )}
                        {req.status === 'completed' && (
                          <Link 
                            to={`/certificate/${req.id}`}
                            className="btn-ghost !text-xs !py-2 flex items-center gap-1.5"
                          >
                            <HiOutlineDocumentDownload className="w-4 h-4 text-emerald-600" />
                            View Digital Recycling Certificate
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ================= TAB 2: PURCHASED PARTS ================= */}
      {activeTab === 'purchased_parts' && (
        componentOrders.length === 0 ? (
          <div className="glass-card p-14 text-center bg-white animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
              <HiOutlineChip className="w-7 h-7 text-text-muted" />
            </div>
            <h2 className="text-base font-bold text-text-primary mb-1">No component orders yet</h2>
            <p className="text-text-secondary text-xs max-w-sm mx-auto mb-5">
              Browse tested reusable components harvested from certified devices in our salvage marketplace.
            </p>
            <Link to="/marketplace" className="btn-primary !text-xs !py-2.5">
              Explore Salvaged Components
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {componentOrders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig.claimed;
              return (
                <div key={order.id} className="glass-card p-5 bg-white border border-border animate-fade-up flex flex-col justify-between" style={{ animationDelay: `${i * 30}ms` }}>
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                          <HiOutlineChip className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary text-sm sm:text-base">
                            {order.component_name}
                          </h3>
                          <p className="text-xs text-text-muted">
                            From: {order.brand} {order.model} ({order.category_name})
                          </p>
                        </div>
                      </div>

                      <span className={`badge ${config.color} text-xs flex-shrink-0`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-surface border border-border text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Seller:</span>
                        <strong className="text-text-primary">{order.seller_name}</strong>
                      </div>
                      {order.seller_email && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">Email:</span>
                          <a href={`mailto:${order.seller_email}`} className="text-primary-700 font-medium hover:underline flex items-center gap-1">
                            <HiOutlineMail className="w-3.5 h-3.5" />
                            {order.seller_email}
                          </a>
                        </div>
                      )}
                      {order.device_location && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">Location:</span>
                          <span className="text-text-secondary truncate max-w-[200px]">{order.device_location}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
                        <span className="text-text-muted">Order Date:</span>
                        <span className="text-text-secondary">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold">
                      {order.price ? `$${order.price}` : 'Salvage Stock'}
                    </span>
                    <a
                      href={`mailto:${order.seller_email}?subject=Regarding order for ${order.component_name} from ${order.brand} ${order.model}`}
                      className="btn-ghost !text-xs !py-1.5 !px-3"
                    >
                      Contact Seller
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ================= TAB 3: INCOMING PARTS ORDERS (FOR SELLERS) ================= */}
      {activeTab === 'incoming_parts' && (
        incomingComponentOrders.length === 0 ? (
          <div className="glass-card p-14 text-center bg-white animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
              <HiOutlineInbox className="w-7 h-7 text-text-muted" />
            </div>
            <h2 className="text-base font-bold text-text-primary mb-1">No incoming component orders</h2>
            <p className="text-text-secondary text-xs max-w-sm mx-auto mb-5">
              When buyers claim reusable components harvested from your assessed devices, they will appear here for shipping fulfillment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingComponentOrders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig.claimed;
              return (
                <div key={order.id} className="glass-card p-5 bg-white border border-border animate-fade-up flex flex-col justify-between" style={{ animationDelay: `${i * 30}ms` }}>
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0">
                          <HiOutlineChip className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-text-primary text-sm sm:text-base">
                            {order.component_name}
                          </h3>
                          <p className="text-xs text-text-muted">
                            From: {order.brand} {order.model}
                          </p>
                        </div>
                      </div>

                      <span className={`badge ${config.color} text-xs flex-shrink-0`}>
                        {config.label}
                      </span>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-surface border border-border text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Buyer:</span>
                        <strong className="text-text-primary">{order.buyer_name}</strong>
                      </div>
                      {order.buyer_email && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted">Email:</span>
                          <a href={`mailto:${order.buyer_email}`} className="text-primary-700 font-medium hover:underline flex items-center gap-1">
                            <HiOutlineMail className="w-3.5 h-3.5" />
                            {order.buyer_email}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-border mt-1">
                        <span className="text-text-muted">Order Date:</span>
                        <span className="text-text-secondary">{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seller Order Transitions */}
                  <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                    <span className="text-emerald-700 font-semibold text-xs">
                      {order.price ? `$${order.price}` : 'Salvage Stock'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {order.status === 'claimed' && (
                        <button
                          onClick={() => updateComponentStatus(order.id, 'dispatched')}
                          className="btn-primary !text-xs !py-1.5 !px-3 cursor-pointer"
                        >
                          Mark Dispatched
                        </button>
                      )}
                      {order.status === 'dispatched' && (
                        <button
                          onClick={() => updateComponentStatus(order.id, 'delivered')}
                          className="btn-primary !text-xs !py-1.5 !px-3 cursor-pointer !bg-emerald-600 hover:!bg-emerald-700"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {(order.status === 'claimed' || order.status === 'dispatched') && (
                        <button
                          onClick={() => updateComponentStatus(order.id, 'cancelled')}
                          className="btn-ghost !text-xs !py-1.5 !px-2.5 text-rose-700 hover:!border-rose-200 cursor-pointer"
                        >
                          Decline / Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
