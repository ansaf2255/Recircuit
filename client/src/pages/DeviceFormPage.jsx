import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineUpload, HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineLightningBolt, HiOutlineArrowRight } from 'react-icons/hi';

const categoryIcons = {
  Mobile: HiOutlineDeviceMobile,
  Laptop: HiOutlineDesktopComputer,
  'Home Appliance': HiOutlineLightningBolt,
};

export default function DeviceFormPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', brand: '', model: '', description: '', location: '' });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) return setError('Please select a category');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => { if (val) formData.append(key, val); });
      if (image) formData.append('image', image);

      const res = await api.post('/devices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/devices/${res.data.id}/questionnaire`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl relative">
      <div className="glow-orb w-[350px] h-[350px] bg-primary-600/10 -top-[100px] -right-[100px]" />

      <div className="page-header animate-fade-up relative z-10">
        <h1 className="page-title gradient-text">List a Device</h1>
        <p className="page-subtitle">Tell us about the device you want to recycle or repurpose.</p>
      </div>

      <div className="glass-card p-6 sm:p-8 relative z-10 animate-fade-up" style={{ animationDelay: '100ms' }}>
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="form-label">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.name] || HiOutlineDeviceMobile;
                const selected = form.category_id === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category_id: String(cat.id) })}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2.5 ${
                      selected
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-lg shadow-primary-500/10'
                        : 'border-border bg-surface-light text-text-muted hover:border-primary-500/40 hover:bg-primary-500/[0.03]'
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Brand</label>
              <input
                type="text"
                placeholder="e.g. Samsung"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Model</label>
              <input
                type="text"
                placeholder="e.g. Galaxy S21"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              placeholder="Describe the condition and any notable issues…"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="form-label">Location</label>
            <input
              type="text"
              placeholder="City"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="form-input"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="form-label">Device Photo</label>
            <div
              className="w-full h-44 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/40 hover:bg-primary-500/[0.02] transition-all duration-200 overflow-hidden"
              onClick={() => document.getElementById('imageInput').click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <HiOutlineUpload className="w-8 h-8 text-text-muted mb-2" />
                  <p className="text-sm text-text-muted">Click to upload image</p>
                </>
              )}
            </div>
            <input id="imageInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 !text-[15px]">
            {loading ? 'Creating…' : (
              <>Continue to Assessment <HiOutlineArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
