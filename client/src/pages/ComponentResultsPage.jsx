import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle, HiOutlineTrash, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';

export default function ComponentResultsPage() {
 const { deviceId } = useParams();
 const navigate = useNavigate();
 const [results, setResults] = useState([]);
 const [device, setDevice] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 loadData();
 }, [deviceId]);

 const loadData = async () => {
 try {
 const [deviceRes, resultsRes] = await Promise.all([
 api.get(`/devices/${deviceId}`),
 api.get(`/components/${deviceId}/results`),
 ]);
 setDevice(deviceRes.data);
 setResults(resultsRes.data);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[60vh]">
 <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
 </div>
 );
 }

 const reusable = results.filter((r) => r.result === 'reusable');
 const recycle = results.filter((r) => r.result === 'recycle');

 return (
 <div className="page-container max-w-2xl">
 {/* Header */}
 <div className="page-header animate-fade-up">
 <Link to={`/devices/${deviceId}/result`} className="text-muted hover:text-muted text-xs flex items-center gap-1.5 mb-3 transition-colors">
 <HiOutlineArrowLeft className="w-4 h-4" />
 Back to device assessment
 </Link>
 <h1 className="page-title text-ink">Salvaged Component Breakdown</h1>
 <p className="page-subtitle">
 {device?.brand} {device?.model} — Component harvesting integrity report
 </p>
 </div>

 {/* Summary cards */}
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 text-center bg-white border border-line animate-fade-up">
 <div className="w-11 h-11 rounded-xl bg-brand-tint text-brand border border-brand-ghost flex items-center justify-center mx-auto mb-2">
 <HiOutlineCheckCircle className="w-6 h-6" />
 </div>
 <p className="text-2xl font-bold text-brand">{reusable.length}</p>
 <p className="text-xs text-muted font-medium mt-0.5">Reusable Harvest Parts</p>
 </div>
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] p-5 text-center bg-white border border-line animate-fade-up" style={{ animationDelay: '40ms' }}>
 <div className="w-11 h-11 rounded-xl bg-danger-bg text-danger-text border border-danger-bg flex items-center justify-center mx-auto mb-2">
 <HiOutlineTrash className="w-6 h-6" />
 </div>
 <p className="text-2xl font-bold text-danger-text">{recycle.length}</p>
 <p className="text-xs text-muted font-medium mt-0.5">Material Recovery Parts</p>
 </div>
 </div>

 {/* Reusable Parts */}
 {reusable.length > 0 && (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] overflow-hidden mb-5 bg-white border border-line animate-fade-up" style={{ animationDelay: '80ms' }}>
 <div className="bg-brand-tint/70 px-5 py-3 border-b border-brand-ghost flex items-center justify-between">
 <h2 className="text-brand font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
 <HiOutlineCheckCircle className="w-4 h-4" />
 Tested Reusable Parts
 </h2>
 <span className="badge bg-brand-tint text-brand border-brand-ghost text-[11px]">
 Listed in Salvage Marketplace
 </span>
 </div>
 <div className="divide-y divide-border/60">
 {reusable.map((r) => (
 <div key={r.id} className="flex items-center justify-between py-3.5 px-5 hover:bg-page/50 transition-colors">
 <div>
 <span className="font-semibold text-ink text-sm">{r.component_name}</span>
 <p className="text-xs text-muted mt-0.5 line-clamp-1">{r.reasoning?.split('\n')[0]}</p>
 </div>
 <span className="badge bg-brand-tint text-brand border-brand-ghost text-xs shrink-0 ml-3">
 ✓ Verified Reusable
 </span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Recycle Parts */}
 {recycle.length > 0 && (
 <div className="bg-surface border border-line rounded-[var(--radius-card)] p-[24px] overflow-hidden mb-6 bg-white border border-line animate-fade-up" style={{ animationDelay: '120ms' }}>
 <div className="bg-danger-bg/70 px-5 py-3 border-b border-danger-bg">
 <h2 className="text-danger-text font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
 <HiOutlineTrash className="w-4 h-4" />
 Recycle / Material Recovery
 </h2>
 </div>
 <div className="divide-y divide-border/60">
 {recycle.map((r) => (
 <div key={r.id} className="flex items-center justify-between py-3.5 px-5 hover:bg-page/50 transition-colors">
 <div>
 <span className="font-semibold text-ink text-sm">{r.component_name}</span>
 <p className="text-xs text-muted mt-0.5 line-clamp-1">{r.reasoning?.split('\n')[0]}</p>
 </div>
 <span className="badge bg-danger-bg text-danger-text border-danger-bg text-xs shrink-0 ml-3">
 ♻ Material Extraction
 </span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Actions */}
 <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: '160ms' }}>
 <Link to={`/devices/${deviceId}/result`} className="btn-ghost flex-1 !py-2.5 justify-center !text-xs">
 <HiOutlineArrowLeft className="w-4 h-4" />
 Back to Device Result
 </Link>
 <Link to="/marketplace" className="btn-primary flex-1 !py-2.5 justify-center !text-xs">
 Explore Salvaged Parts Marketplace →
 </Link>
 </div>
 </div>
 );
}
