import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  HiOutlineCheckCircle, 
  HiOutlinePrinter, 
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineGlobeAlt
} from 'react-icons/hi';

export default function CertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);

  useEffect(() => {
    api.get(`/requests`).then(res => {
      const req = res.data.find(r => r.id === parseInt(id));
      if (req) setRequest(req);
    });
  }, [id]);

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page">
        <div className="w-10 h-10 border-4 border-brand-ghost border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  const certNumber = `RC-${new Date(request.created_at).getFullYear()}-${String(request.id).padStart(6, '0')}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-page)] via-[#e4f0ec] to-[var(--color-page)] py-6 px-4 print:p-0 print:bg-white flex flex-col items-center justify-center">
      {/* Non-print toolbar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 print:hidden relative z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="btn-ghost !text-xs !py-1.5 flex items-center gap-1.5 cursor-pointer bg-white/50 backdrop-blur-sm shadow-sm"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <button 
          onClick={() => window.print()} 
          className="btn-primary !text-xs !py-1.5 flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <HiOutlinePrinter className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Official Certificate Card */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden relative print:shadow-none print:m-0 border border-brand-ghost">
        
        {/* Decorative Top Border */}
        <div className="h-2 w-full bg-gradient-to-r from-brand via-[#24A17B] to-brand print:hidden"></div>
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.02] print:opacity-[0.04]">
          <HiOutlineShieldCheck className="w-[400px] h-[400px] text-brand transform -rotate-12" />
        </div>

        <div className="p-8 sm:p-10 relative z-10">
          {/* Certificate Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-brand-ghost pb-6 mb-8 gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-tint to-[#d1ebe1] text-brand border border-brand/20 flex items-center justify-center shadow-inner">
                <HiOutlineBadgeCheck className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand to-[#0c533d] tracking-tight">
                  Certificate of Sustainability
                </h1>
                <p className="text-xs text-brand/80 mt-0.5 font-medium">
                  Official Verification of Electronics Recovery & Diverted E-Waste
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right bg-brand-tint/30 p-2.5 rounded-lg border border-brand-ghost">
              <div className="text-[9px] font-bold text-brand/70 uppercase tracking-widest mb-0.5">Serial Number</div>
              <div className="font-mono text-xs font-extrabold text-brand tracking-wider">{certNumber}</div>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="text-center py-5">
            <div className="inline-flex items-center justify-center gap-1.5 mb-2">
              <HiOutlineGlobeAlt className="w-4 h-4 text-brand/60" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand/60 font-bold">This is to certify that</p>
              <HiOutlineGlobeAlt className="w-4 h-4 text-brand/60" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-4">
              {request.seller_name}
            </h2>
            
            <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto leading-relaxed font-medium">
              has responsibly surrendered and processed the following electronics hardware under certified circular economy standards:
            </p>

            <div className="my-7 p-5 sm:p-6 bg-gradient-to-br from-white to-[#f0f9f6] rounded-xl border border-brand-ghost/60 inline-block text-left w-full max-w-xl shadow-sm relative overflow-hidden">
              {/* Subtle accent line inside the box */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand"></div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs pl-2">
                <div>
                  <span className="text-brand/70 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Device Hardware</span>
                  <strong className="text-ink font-bold text-sm">{request.brand} {request.model}</strong>
                </div>
                <div>
                  <span className="text-brand/70 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Hardware Category</span>
                  <strong className="text-ink font-bold text-sm">{request.category_name}</strong>
                </div>
                <div>
                  <span className="text-brand/70 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Processing Outcome</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand text-white shadow-sm mt-0.5">
                    {request.classification}
                  </span>
                </div>
                <div>
                  <span className="text-brand/70 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Certified Partner</span>
                  <strong className="text-ink font-bold text-sm">{request.partner_name}</strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-muted max-w-lg mx-auto leading-relaxed">
              By diverting this device from landfill, toxic heavy metals and scarce earth elements were successfully recovered and reintegrated into the circular technology supply chain.
            </p>
          </div>

          {/* Footer with Signatures & Hash */}
          <div className="mt-8 pt-6 border-t border-brand-ghost flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shadow-md">
                <HiOutlineCheckCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-ink text-xs">
                  Issued: {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="text-[10px] text-brand/70 font-medium mt-0.5">
                  Authorized by ReCircuit Electronic Recovery Network
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-brand text-[10px] font-mono bg-brand-tint/40 px-3 py-2 rounded-lg border border-brand/20 shadow-inner">
              <HiOutlineShieldCheck className="w-3.5 h-3.5" />
              <span className="font-bold tracking-tight">VERIFIED DIGITAL LEDGER RECORD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
