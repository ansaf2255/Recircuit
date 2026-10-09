import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineCheckCircle } from 'react-icons/hi';

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

  if (!request) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-slate-800 p-4 sm:p-10 flex flex-col items-center justify-center font-serif relative">
      {/* Non-print controls */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8 print:hidden">
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-sans font-medium">
          ← Back to Requests
        </button>
        <button onClick={() => window.print()} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-sans font-medium shadow-lg shadow-emerald-500/30">
          Print / Save as PDF
        </button>
      </div>

      <div className="border-[16px] border-emerald-700 p-8 sm:p-16 w-full max-w-5xl text-center bg-emerald-50/30 shadow-2xl relative overflow-hidden my-16">
        <div className="absolute inset-0 border-[4px] border-emerald-400/50 m-2" />
        
        <HiOutlineCheckCircle className="w-24 h-24 text-emerald-600 mx-auto mb-8 relative z-10" />
        
        <h1 className="text-4xl sm:text-5xl font-bold text-emerald-800 tracking-wider uppercase mb-10 relative z-10 font-serif">
          Certificate of Eco-Responsibility
        </h1>
        
        <p className="text-xl text-slate-600 mb-4 relative z-10 italic">This is proudly presented to</p>
        <h2 className="text-3xl sm:text-5xl font-bold text-slate-800 mb-10 border-b-2 border-emerald-300 inline-block px-12 pb-3 relative z-10 font-serif">
          {request.seller_name}
        </h2>
        
        <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed mb-16 relative z-10">
          For their outstanding commitment to environmental sustainability by successfully diverting their 
          <strong className="text-slate-900 mx-2">{request.brand} {request.model} ({request.category_name})</strong>
          from landfill. This device has been officially processed for <strong className="uppercase text-emerald-700 font-bold ml-1">{request.classification}</strong>.
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-end mt-10 px-4 sm:px-16 relative z-10 gap-10">
          <div className="text-center w-full sm:w-auto">
            <div className="border-b border-slate-400 w-48 sm:w-64 mx-auto mb-3 pb-2 text-xl font-semibold text-slate-800">
              {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-sans font-medium">Date</p>
          </div>
          
          <div className="text-center w-full sm:w-auto">
            <div className="border-b border-slate-400 w-48 sm:w-64 mx-auto mb-3 pb-2 text-2xl font-bold italic text-emerald-700 font-serif">
              ReCircuit Platform
            </div>
            <p className="text-sm text-slate-500 uppercase tracking-widest font-sans font-medium">Authorized by</p>
          </div>
        </div>
      </div>
    </div>
  );
}
