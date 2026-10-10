import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
 HiOutlineArrowRight, 
 HiOutlineArrowLeft,
 HiOutlineLocationMarker,
 HiOutlineShoppingCart,
 HiOutlineCheckCircle,
 HiOutlineTrash,
 HiOutlinePencilAlt
} from 'react-icons/hi';

const classBadges = {
 reuse: 'badge-reuse',
 resell: 'badge-resell',
 refurbish: 'badge-refurbish',
 recycle: 'badge-recycle',
};

export default function DeviceDetailPage() {
 const { deviceId } = useParams();
 const { user } = useAuth();
 const { addToast } = useToast();
 const navigate = useNavigate();

 const [device, setDevice] = useState(null);
 const [classification, setClassification] = useState(null);
 const [componentResults, setComponentResults] = useState([]);
 const [loading, setLoading] = useState(true);
 const [claiming, setClaiming] = useState(false);

 useEffect(() => {
 loadData();
 }, [deviceId]);

 const loadData = async () => {
 try {
 const deviceRes = await api.get(`/devices/${deviceId}`);
 setDevice(deviceRes.data);

 try {
 const classRes = await api.get(`/questionnaire/${deviceId}`);
 setClassification(classRes.data);
 } catch {}

 if (user?.role !== 'recycler') {
 try {
 const compRes = await api.get(`/components/${deviceId}/results`);
 setComponentResults(compRes.data);
 } catch {}
 }
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 const handleClaim = async () => {
 setClaiming(true);
 try {
 await api.post(`/matches/claim/${deviceId}`);
 addToast('Device successfully requested! Moved to your Requests dashboard.');
 navigate('/requests');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to claim device.');
 setClaiming(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 </div>
 );
 }

 if (!device) {
 return (
 <div className="page-container max-w-xl text-center py-16">
 <h2 className="text-lg font-bold text-ink">Device Not Found</h2>
 <p className="text-xs text-muted mt-1">This listing may have been removed or claimed.</p>
 <Link to="/marketplace" className="btn-primary !text-xs !py-2 mt-4 inline-flex">
 Back to Marketplace
 </Link>
 </div>
 );
 }

 const isOwner = user?.id === device.user_id;
 const isTargetRecycler = classification?.result === 'recycle';
 const canClaim = !isOwner && (
 user?.role === 'admin' ||
 (user?.role === 'recycler' && isTargetRecycler) ||
 ((user?.role === 'refurbisher' || user?.role === 'seller') && !isTargetRecycler)
 );

 return (
 <div className="page-container max-w-4xl">
 {/* Back button */}
 <div className="mb-5">
 <button
 onClick={() => navigate(-1)}
 className="text-xs text-muted hover:text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
 >
 <HiOutlineArrowLeft className="w-4 h-4" />
 Back
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
 {/* Left Column: Photos & Details */}
 <div className="lg:col-span-7 space-y-5">
 {/* Photos */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] overflow-hidden bg-white">
 {device.images && device.images.length > 0 ? (
 <div className="w-full">
 <div className="h-72 w-full bg-surface overflow-hidden">
 <img
 src={device.images[0]}
 alt={`${device.brand} ${device.model}`}
 className="w-full h-full object-cover"
 />
 </div>
 {device.images.length > 1 && (
 <div className="flex gap-2 p-3 bg-surface border-t border-line overflow-x-auto">
 {device.images.map((img, idx) => (
 <img
 key={idx}
 src={img}
 alt={`Photo ${idx + 1}`}
 className="w-16 h-16 rounded-lg object-cover border border-line flex-shrink-0"
 />
 ))}
 </div>
 )}
 </div>
 ) : (
 <div className="h-60 bg-surface flex items-center justify-center text-muted text-xs">
 No photos provided for this listing.
 </div>
 )}
 </div>

 {/* Description & Overview */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-6 bg-white">
 <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">
 Listing Description
 </h2>
 <p className="text-sm text-muted leading-relaxed">
 {device.description || 'No additional comments provided by the seller.'}
 </p>

 <div className="mt-5 pt-4 border-t border-line grid grid-cols-2 gap-4 text-xs">
 <div>
 <span className="text-muted block">Category</span>
 <span className="font-semibold text-ink">{device.category_name}</span>
 </div>
 <div>
 <span className="text-muted block">Listed Date</span>
 <span className="font-semibold text-ink">{new Date(device.created_at).toLocaleDateString()}</span>
 </div>
 <div>
 <span className="text-muted block">Seller</span>
 <span className="font-semibold text-ink">{device.user_name || 'Verified User'}</span>
 </div>
 <div>
 <span className="text-muted block">Location</span>
 <span className="font-semibold text-ink flex items-center gap-1 truncate">
 <HiOutlineLocationMarker className="w-3.5 h-3.5 text-muted" />
 {device.location || 'Not specified'}
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Right Column: Diagnostics, Classification & Action */}
 <div className="lg:col-span-5 space-y-5">
 {/* Classification Outcome Card */}
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-6 bg-white">
 <div className="flex items-start justify-between gap-3 mb-4">
 <div>
 <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
 Hardware Identification
 </span>
 <h1 className="text-xl font-bold text-ink leading-tight mt-0.5">
 {device.brand} {device.model}
 </h1>
 </div>

 {classification ? (
 <span className={`badge capitalize text-xs shadow-xs ${classBadges[classification.result] || ''}`}>
 {classification.result}
 </span>
 ) : (
 <span className="badge bg-warning-bg text-warning-text border-warning-bg text-xs">
 Pending Assessment
 </span>
 )}
 </div>

 {classification?.score !== undefined && classification?.score !== null && (
 <div className="p-3 rounded-xl bg-surface border border-line mb-4 text-xs flex items-center justify-between">
 <span className="text-muted">Diagnostic Health Score:</span>
 <strong className="text-ink font-bold text-sm">{classification.score} / 100</strong>
 </div>
 )}

 {/* Actions */}
 <div className="space-y-2 pt-2 border-t border-line">
 {isOwner ? (
 <>
 {!classification ? (
 <Link
 to={`/devices/${deviceId}/questionnaire`}
 className="btn-primary w-full justify-center !text-xs !py-3"
 >
 Complete Condition Assessment <HiOutlineArrowRight className="w-4 h-4" />
 </Link>
 ) : (
 <>
 <Link
 to={`/devices/${deviceId}/result`}
 className="btn-primary w-full justify-center !text-xs !py-2.5"
 >
 View Assessment Report
 </Link>
 <Link
 to={`/devices/${deviceId}/match`}
 className="btn-ghost w-full justify-center !text-xs !py-2.5"
 >
 Find Matching Logistics Partner
 </Link>
 </>
 )}
 </>
 ) : (
 <>
 {canClaim ? (
 <button
 onClick={handleClaim}
 disabled={claiming}
 className="btn-primary w-full justify-center !text-xs !py-3 cursor-pointer"
 >
 {claiming ? (
 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 <HiOutlineShoppingCart className="w-4 h-4" />
 Purchase / Claim Device
 </>
 )}
 </button>
 ) : (
 <div className="p-3 bg-surface rounded-xl border border-line text-[11px] text-muted text-center">
 {isTargetRecycler ? 'Available for certified recyclers.' : 'Available for consumers & refurbishers.'}
 </div>
 )}
 </>
 )}
 </div>
 </div>

 {/* Salvage Component Breakdown (Consumers & Refurbishers only) */}
 {componentResults.length > 0 && user?.role !== 'recycler' && (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 bg-white">
 <h3 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">
 Salvage Component Assessment
 </h3>
 <div className="space-y-1.5">
 {componentResults.map((r) => (
 <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-surface text-xs">
 <span className="font-medium text-ink">{r.component_name}</span>
 <span className={`badge capitalize text-[10px] ${r.result === 'reusable' ? 'badge-reuse' : 'badge-recycle'}`}>
 {r.result}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
