import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineChip, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineLocationMarker } from 'react-icons/hi';
import LocationPickerModal from '../components/LocationPickerModal';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seller', location: '' });
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let authData;
      if (isRegister) {
        authData = await register(form);
      } else {
        authData = await login(form.email, form.password);
      }
      if (authData?.user?.role === 'admin' || form.email === 'admin@recircuit.com') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (email, password) => {
    setForm(prev => ({ ...prev, email, password }));
    setIsRegister(false);
    setError('');
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-surface">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border border-border shadow-sm p-8 sm:p-10 animate-fade-up">
        {/* Google / Brand Identity */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-700 flex items-center justify-center text-white mb-3 shadow-xs">
            <HiOutlineChip className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">ReCircuit</h1>
          <p className="text-text-secondary mt-1 text-center text-xs">
            {isRegister ? 'Register your hardware enterprise account' : 'Sign in with your ReCircuit account'}
          </p>
        </div>

        {error && (
          <div className="mb-5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  className="form-input !pl-10 !py-2.5 !text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Email address</label>
            <div className="relative">
              <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email"
                placeholder="name@organization.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                required
                className="form-input !pl-10 !py-2.5 !text-xs"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                className="form-input !pl-10 !py-2.5 !text-xs"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="form-label">Account Role</label>
                <select
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  className="form-input !py-2 !text-xs"
                >
                  <option value="seller">Refurbisher / Consumer — Buy & Sell</option>
                  <option value="recycler">Recycler — Scrap Recovery & Material Processing</option>
                </select>
              </div>

              <div>
                <label className="form-label">Regional Location</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <HiOutlineLocationMarker className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="e.g. Austin, Texas"
                      value={form.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className="form-input !pl-10 !py-2 !text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="btn-ghost !text-xs !py-2 !px-3 cursor-pointer shrink-0"
                  >
                    Map
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 !text-xs !mt-5 cursor-pointer">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : (
              isRegister ? 'Complete Registration' : 'Sign In'
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-text-secondary">
          {isRegister ? 'Already registered?' : "Need an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-primary-700 hover:underline font-semibold cursor-pointer ml-1"
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </button>
        </p>

        {/* Demo Credentials Quick-Fill */}
        {!isRegister && (
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 text-center">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setDemoCredentials('refurbisher@recircuit.com', 'refurbisher123')}
                className="px-2 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-medium text-text-secondary hover:text-text-primary hover:border-primary-300 transition-colors cursor-pointer text-center"
              >
                Refurbisher / Consumer
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('recycler@recircuit.com', 'recycler123')}
                className="px-2 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-medium text-text-secondary hover:text-text-primary hover:border-primary-300 transition-colors cursor-pointer text-center"
              >
                Recycler
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@recircuit.com', 'admin123')}
                className="px-2 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-medium text-text-secondary hover:text-text-primary hover:border-primary-300 transition-colors cursor-pointer text-center"
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <LocationPickerModal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          initialLocationName={form.location}
          onSelectLocation={(loc) => updateField('location', loc)}
        />
      </div>
    </div>
  );
}
