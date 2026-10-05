import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineChip, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineLocationMarker } from 'react-icons/hi';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'seller', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-600/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-[128px]" />

      <div className="glass-card w-full max-w-md p-8 relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center mb-4 pulse-glow">
            <HiOutlineChip className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">ReCircuit</h1>
          <p className="text-text-secondary mt-2 text-center">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          )}

          <div className="relative">
            <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />
          </div>

          {isRegister && (
            <>
              <select
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
                className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              >
                <option value="seller">Seller — List devices</option>
                <option value="recycler">Recycler — Process e-waste</option>
                <option value="refurbisher">Refurbisher — Repair &amp; resell</option>
              </select>

              <div className="relative">
                <HiOutlineLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Location (city)"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
