import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  HiOutlineCheckCircle, 
  HiOutlinePrinter, 
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineQrcode
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
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const certNumber = `RC-${new Date(request.created_at).getFullYear()}-${String(request.id).padStart(6, '0')}`;

  return (
    <div className="min-h-screen bg-surface py-10 px-4 print:p-0 print:bg-white flex flex-col items-center justify-center">
      {/* Non-print toolbar */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="btn-ghost !text-xs !py-2 flex items-center gap-1.5 cursor-pointer"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <button 
          onClick={() => window.print()} 
          className="btn-primary !text-xs !py-2 flex items-center gap-1.5 cursor-pointer"
        >
          <HiOutlinePrinter className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* Official Certificate Card */}
      <div className="w-full max-w-4xl bg-white border border-[#dadce0] rounded-2xl shadow-sm p-10 sm:p-14 relative print:border-none print:shadow-none print:m-0 text-text-primary">
        {/* Certificate Header */}
        <div className="flex items-start justify-between border-b border-border pb-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <HiOutlineShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                Certificate of Sustainable Processing
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Official Verification of Electronics Recovery & Diverted E-Waste
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Serial Number</div>
            <div className="font-mono text-xs font-bold text-text-primary mt-0.5">{certNumber}</div>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="text-center py-6">
          <p className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-2">This is to certify that</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-4">
            {request.seller_name}
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            has responsibly surrendered and processed the following electronics hardware under certified circular economy standards:
          </p>

          <div className="my-8 p-6 bg-surface rounded-xl border border-border inline-block text-left w-full max-w-lg">
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
              <div>
                <span className="text-text-muted block text-[11px]">Device Hardware</span>
                <strong className="text-text-primary font-semibold">{request.brand} {request.model}</strong>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Hardware Category</span>
                <strong className="text-text-primary font-semibold">{request.category_name}</strong>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Processing Outcome</span>
                <span className="badge badge-reuse uppercase text-[11px] font-bold mt-0.5">
                  {request.classification}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Certified Partner</span>
                <strong className="text-text-primary font-semibold">{request.partner_name}</strong>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-muted max-w-xl mx-auto leading-normal">
            By diverting this device from landfill, toxic heavy metals and scarce earth elements were recovered and reintegrated into the circular technology supply chain.
          </p>
        </div>

        {/* Footer with Signatures & Hash */}
        <div className="mt-10 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-text-secondary">
          <div>
            <div className="font-semibold text-text-primary">
              Issued: {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">Authorized by ReCircuit Electronic Recovery Network</div>
          </div>

          <div className="flex items-center gap-2 text-text-muted text-[11px] font-mono bg-surface px-3 py-1.5 rounded-lg border border-border">
            <span>VERIFIED DIGITAL LEDGER RECORD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
