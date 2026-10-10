import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { 
 HiOutlineUser, 
 HiOutlineLocationMarker, 
 HiOutlineCheckCircle, 
 HiOutlineArrowLeft,
 HiOutlineShieldCheck
} from 'react-icons/hi';

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
 setError(err.response?.data?.error || 'Failed to load eligible partners.');
 } finally {
 setLoading(false);
 }
 };

 const selectPartner = async (partnerId) => {
 setMatching(true);
 try {
 await api.post(`/matches/${deviceId}`, { partner_id: partnerId });
 addToast('Pickup request created! Track status in Orders & Requests.');
 navigate('/requests');
 } catch (err) {
 addToast(err.response?.data?.error || 'Failed to connect with partner.');
 setMatching(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 </div>
 );
 }

 if (error) {
 return (
 <div className="page-container max-w-xl text-center py-12">
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-8 bg-white">
 <p className="text-danger-text text-sm font-medium mb-4">{error}</p>
 <Link to={`/devices/${deviceId}/result`} className="btn-ghost !text-xs !py-2 inline-flex items-center gap-1.5">
 <HiOutlineArrowLeft className="w-4 h-4" /> Back to Assessment Results
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="page-container max-w-3xl">
 {/* Header */}
 <div className="page-header animate-fade-up">
 <Link to={`/devices/${deviceId}/result`} className="text-muted hover:text-muted text-xs flex items-center gap-1.5 mb-3 transition-colors">
 <HiOutlineArrowLeft className="w-4 h-4" />
 Back to device assessment
 </Link>
 <h1 className="page-title text-ink">Certified Logistics Partners</h1>
 <p className="page-subtitle">
 Select a verified enterprise refurbisher or certified recycler to coordinate hardware pickup.
 </p>
 </div>

 <div className="space-y-3">
 {candidates.map((partner, i) => (
 <div
 key={partner.id}
 className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 sm:p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up hover:border-brand-ghost transition-all"
 style={{ animationDelay: `${(i + 1) * 40}ms` }}
 >
 <div className="flex items-start gap-4">
 <div className="w-11 h-11 rounded-full bg-[#d3e3fd] text-[#041e49] flex items-center justify-center font-bold text-base flex-shrink-0 border border-brand-ghost">
 {partner.name?.charAt(0)?.toUpperCase()}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-base font-bold text-ink">
 {partner.name}
 </h3>
 <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand bg-brand-tint px-2 py-0.5 rounded-md border border-brand-ghost">
 <HiOutlineShieldCheck className="w-3.5 h-3.5 text-brand" />
 Verified Partner
 </span>
 </div>

 <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
 <span className="capitalize text-muted">
 Specialization: <strong className="text-ink font-medium">{partner.role}</strong>
 </span>
 {partner.location && (
 <span className="flex items-center gap-1 text-muted">
 <HiOutlineLocationMarker className="w-3.5 h-3.5" />
 <strong className="text-ink font-medium">{partner.location}</strong>
 </span>
 )}
 </div>
 </div>
 </div>
 
 <button
 onClick={() => selectPartner(partner.id)}
 disabled={matching}
 className="btn-primary w-full sm:w-auto !text-xs !py-2.5 flex-shrink-0 cursor-pointer"
 >
 Select Partner
 </button>
 </div>
 ))}

 {candidates.length === 0 && (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-12 text-center bg-white animate-fade-up">
 <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
 <HiOutlineUser className="w-6 h-6 text-muted" />
 </div>
 <h2 className="text-base font-bold text-ink mb-1">No verified partners in this area yet</h2>
 <p className="text-muted text-xs max-w-sm mx-auto mb-4">
 You can explore our open marketplace to let regional refurbishers and certified recyclers browse your device.
 </p>
 <Link to="/marketplace" className="btn-primary !text-xs !py-2">
 Explore Open Marketplace
 </Link>
 </div>
 )}
 </div>
 </div>
 );
}
