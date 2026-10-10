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
 pending: { color: 'text-warning-text bg-warning-bg border-warning-bg', icon: HiOutlineClock, label: 'Pending' },
 accepted: { color: 'text-blue-800 bg-blue-50 border-blue-200', icon: HiOutlineCheck, label: 'Accepted' },
 completed: { color: 'text-brand bg-brand-tint border-brand-ghost', icon: HiOutlineCheckCircle, label: 'Completed' },
 cancelled: { color: 'text-danger-text bg-danger-bg border-danger-bg', icon: HiOutlineXCircle, label: 'Cancelled' },
 claimed: { color: 'text-warning-text bg-warning-bg border-warning-bg', icon: HiOutlineClock, label: 'Order Claimed' },
 dispatched: { color: 'text-blue-800 bg-blue-50 border-blue-200', icon: HiOutlineTruck, label: 'Dispatched / In Transit' },
 delivered: { color: 'text-brand bg-brand-tint border-brand-ghost', icon: HiOutlineCheckCircle, label: 'Delivered' },
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
 <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="page-container relative">
 <div className="page-header relative z-10 animate-fade-up">
 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div>
 <h1 className="page-title text-ink">
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
 <div className="inline-flex p-1 bg-page border border-line rounded-full shadow-xs self-start lg:self-center overflow-x-auto max-w-full">
 <button
 onClick={() => setActiveTab('devices')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
 activeTab === 'devices'
 ? 'bg-brand text-surface shadow-xs'
 : 'text-muted hover:text-ink'
 }`}
 >
 <HiOutlineDeviceMobile className="w-4 h-4" />
 Device Pickups ({requests.length})
 </button>
 <button
 onClick={() => setActiveTab('purchased_parts')}
 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
 activeTab === 'purchased_parts'
 ? 'bg-brand text-surface shadow-xs'
 : 'text-muted hover:text-ink'
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
 ? 'bg-brand text-surface shadow-xs'
 : 'text-muted hover:text-ink'
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
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-14 text-center bg-white animate-fade-up">
 <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
 <HiOutlineClock className="w-7 h-7 text-muted" />
 </div>
 <h2 className="text-base font-bold text-ink mb-1">No active device pickups</h2>
 <p className="text-muted text-xs max-w-sm mx-auto mb-5">
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
 <div key={req.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] overflow-hidden bg-white animate-fade-up border border-line" style={{ animationDelay: `${i * 30}ms` }}>
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
 <div className="text-[11px] uppercase font-semibold text-muted tracking-wider">
 {req.category_name}
 </div>
 <h3 className="font-bold text-ink text-base leading-tight mt-0.5">
 {req.brand} {req.model}
 </h3>
 </div>
 <span className={`badge flex-shrink-0 ${config.color}`}>
 <StatusIcon className="w-3.5 h-3.5" />
 {config.label}
 </span>
 </div>

 {/* Meta */}
 <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mb-3">
 {req.classification && (
 <span className="capitalize font-semibold text-ink">
 Outcome: {req.classification}
 </span>
 )}
 {req.device_location && (
 <span className="flex items-center gap-1">
 <HiOutlineLocationMarker className="w-3.5 h-3.5 text-muted" />
 {req.device_location}
 </span>
 )}
 </div>

 {/* Partner / Seller Contact Box */}
 <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted mb-3 p-3 bg-surface rounded-xl border border-line">
 {req.partner_name && (
 <div>
 <span className="text-muted">Matched Partner: </span>
 <strong className="text-ink font-medium">{req.partner_name}</strong>
 {req.partner_email && (
 <a href={`mailto:${req.partner_email}`} className="ml-1 text-brand hover:underline">
 ({req.partner_email})
 </a>
 )}
 </div>
 )}
 {req.seller_name && (
 <div>
 <span className="text-muted">Device Owner: </span>
 <strong className="text-ink font-medium">{req.seller_name}</strong>
 {req.seller_email && (
 <a href={`mailto:${req.seller_email}`} className="ml-1 text-brand hover:underline">
 ({req.seller_email})
 </a>
 )}
 </div>
 )}
 </div>

 {req.description && (
 <p className="text-xs text-muted italic line-clamp-2 mb-3">"{req.description}"</p>
 )}

 {/* Components Breakdown */}
 {(reusableParts.length > 0 || recycleParts.length > 0) && (
 <div className="flex flex-wrap gap-2 text-xs">
 {reusableParts.length > 0 && (
 <span className="badge border-brand-ghost bg-brand-tint text-brand font-medium">
 ✓ Reusable: {reusableParts.map(c => c.component_name).join(', ')}
 </span>
 )}
 {recycleParts.length > 0 && (
 <span className="badge border-danger-bg bg-danger-bg text-danger-text font-medium">
 ♻ Material Recovery: {recycleParts.map(c => c.component_name).join(', ')}
 </span>
 )}
 </div>
 )}
 </div>

 {/* Action buttons */}
 <div className="flex gap-2 mt-4 pt-4 border-t border-line">
 {req.status === 'pending' && user.id === req.seller_id && (
 <>
 <button
 onClick={() => updateRequestStatus(req.id, 'accepted')}
 className="px-4 py-2 bg-brand-tint border border-brand-ghost text-brand hover:bg-brand-tint rounded-full text-xs font-semibold transition-colors cursor-pointer"
 >
 Accept Pickup Request
 </button>
 <button
 onClick={() => updateRequestStatus(req.id, 'cancelled')}
 className="px-4 py-2 bg-danger-bg border border-danger-bg text-danger-text hover:bg-danger-bg rounded-full text-xs font-semibold transition-colors cursor-pointer"
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
 <HiOutlineDocumentDownload className="w-4 h-4 text-brand" />
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
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-14 text-center bg-white animate-fade-up">
 <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
 <HiOutlineChip className="w-7 h-7 text-muted" />
 </div>
 <h2 className="text-base font-bold text-ink mb-1">No component orders yet</h2>
 <p className="text-muted text-xs max-w-sm mx-auto mb-5">
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
 <div key={order.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white border border-line animate-fade-up flex flex-col justify-between" style={{ animationDelay: `${i * 30}ms` }}>
 <div>
 <div className="flex items-start justify-between gap-3 mb-2">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-brand-tint text-brand border border-brand-ghost flex items-center justify-center flex-shrink-0">
 <HiOutlineChip className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-ink text-sm sm:text-base">
 {order.component_name}
 </h3>
 <p className="text-xs text-muted">
 From: {order.brand} {order.model} ({order.category_name})
 </p>
 </div>
 </div>

 <span className={`badge ${config.color} text-xs flex-shrink-0`}>
 {config.label}
 </span>
 </div>

 <div className="mt-3 p-3 rounded-xl bg-surface border border-line text-xs flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <span className="text-muted">Seller:</span>
 <strong className="text-ink">{order.seller_name}</strong>
 </div>
 {order.seller_email && (
 <div className="flex items-center justify-between">
 <span className="text-muted">Email:</span>
 <a href={`mailto:${order.seller_email}`} className="text-brand font-medium hover:underline flex items-center gap-1">
 <HiOutlineMail className="w-3.5 h-3.5" />
 {order.seller_email}
 </a>
 </div>
 )}
 {order.device_location && (
 <div className="flex items-center justify-between">
 <span className="text-muted">Location:</span>
 <span className="text-muted truncate max-w-[200px]">{order.device_location}</span>
 </div>
 )}
 <div className="flex items-center justify-between pt-1 border-t border-line mt-1">
 <span className="text-muted">Order Date:</span>
 <span className="text-muted">{new Date(order.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 </div>

 <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
 <span className="text-brand font-semibold">
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
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-14 text-center bg-white animate-fade-up">
 <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
 <HiOutlineInbox className="w-7 h-7 text-muted" />
 </div>
 <h2 className="text-base font-bold text-ink mb-1">No incoming component orders</h2>
 <p className="text-muted text-xs max-w-sm mx-auto mb-5">
 When buyers claim reusable components harvested from your assessed devices, they will appear here for shipping fulfillment.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {incomingComponentOrders.map((order, i) => {
 const config = statusConfig[order.status] || statusConfig.claimed;
 return (
 <div key={order.id} className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white border border-line animate-fade-up flex flex-col justify-between" style={{ animationDelay: `${i * 30}ms` }}>
 <div>
 <div className="flex items-start justify-between gap-3 mb-2">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center flex-shrink-0">
 <HiOutlineChip className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-ink text-sm sm:text-base">
 {order.component_name}
 </h3>
 <p className="text-xs text-muted">
 From: {order.brand} {order.model}
 </p>
 </div>
 </div>

 <span className={`badge ${config.color} text-xs flex-shrink-0`}>
 {config.label}
 </span>
 </div>

 <div className="mt-3 p-3 rounded-xl bg-surface border border-line text-xs flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <span className="text-muted">Buyer:</span>
 <strong className="text-ink">{order.buyer_name}</strong>
 </div>
 {order.buyer_email && (
 <div className="flex items-center justify-between">
 <span className="text-muted">Email:</span>
 <a href={`mailto:${order.buyer_email}`} className="text-brand font-medium hover:underline flex items-center gap-1">
 <HiOutlineMail className="w-3.5 h-3.5" />
 {order.buyer_email}
 </a>
 </div>
 )}
 <div className="flex items-center justify-between pt-1 border-t border-line mt-1">
 <span className="text-muted">Order Date:</span>
 <span className="text-muted">{new Date(order.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 </div>

 {/* Seller Order Transitions */}
 <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
 <span className="text-brand font-semibold text-xs">
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
 className="btn-primary !text-xs !py-1.5 !px-3 cursor-pointer !bg-brand hover:!bg-brand"
 >
 Mark Delivered
 </button>
 )}
 {(order.status === 'claimed' || order.status === 'dispatched') && (
 <button
 onClick={() => updateComponentStatus(order.id, 'cancelled')}
 className="btn-ghost !text-xs !py-1.5 !px-2.5 text-danger-text hover:!border-danger-bg cursor-pointer"
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
