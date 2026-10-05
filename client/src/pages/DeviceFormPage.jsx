import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineUpload, HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineLightningBolt } from 'react-icons/hi';

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">List a Device</h1>
        <p className="text-text-secondary mt-2">Tell us about the device you want to recycle or repurpose.</p>
      </div>

      <div className="glass-card p-6">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">Category</label>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.name] || HiOutlineDeviceMobile;
                const selected = form.category_id === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category_id: String(cat.id) })}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selected
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-border bg-surface-light text-text-muted hover:border-primary-500/50'
                    }`}
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Brand</label>
              <input
                type="text"
                placeholder="e.g. Samsung"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Model</label>
              <input
                type="text"
                placeholder="e.g. Galaxy S21"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              placeholder="Describe the condition and any notable issues…"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Location</label>
            <input
              type="text"
              placeholder="City"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Device Photo</label>
            <div
              className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-500/50 transition-all overflow-hidden"
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
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-primary-500/25"
          >
            {loading ? 'Creating…' : 'Continue to Assessment →'}
          </button>
        </form>
      </div>
    </div>
  );
}
