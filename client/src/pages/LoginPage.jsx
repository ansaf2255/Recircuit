import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      {/* Background orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-primary-600/15 top-[10%] -left-[200px]" />
      <div className="glow-orb w-[400px] h-[400px] bg-emerald-500/12 bottom-[10%] -right-[150px]" />
      <div className="glow-orb w-[300px] h-[300px] bg-cyan-500/8 top-[60%] left-[30%]" />

      <div className="glass-card w-full max-w-[420px] p-8 sm:p-10 relative animate-fade-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center mb-5 pulse-glow">
            <HiOutlineChip className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold gradient-text tracking-tight">ReCircuit</h1>
          <p className="text-text-secondary mt-2 text-center text-sm">
            {isRegister ? 'Create your account to get started' : 'Welcome back — sign in to continue'}
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
              <input
                type="text"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                className="form-input !pl-11"
              />
            </div>
          )}

          <div className="relative">
            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              required
              className="form-input !pl-11"
            />
          </div>

          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
              className="form-input !pl-11"
            />
          </div>

          {isRegister && (
            <>
              <select
                value={form.role}
                onChange={(e) => updateField('role', e.target.value)}
                className="form-input"
              >
                <option value="seller">Seller — List devices</option>
                <option value="recycler">Recycler — Process e-waste</option>
                <option value="refurbisher">Refurbisher — Repair & resell</option>
              </select>

              <div className="relative">
                <HiOutlineLocationMarker className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Location (city)"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="form-input !pl-11"
                />
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 !text-[15px]">
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

        <p className="mt-6 text-center text-sm text-text-muted">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-primary-400 hover:text-primary-300 font-semibold transition-colors"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
