import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { HiOutlineUpload, HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineLightningBolt, HiOutlineArrowRight, HiOutlineDatabase, HiOutlineX, HiOutlineLocationMarker } from 'react-icons/hi';
import LocationPickerModal from '../components/LocationPickerModal';

const categoryIcons = {
  Mobile: HiOutlineDeviceMobile,
  Laptop: HiOutlineDesktopComputer,
  'Home Appliance': HiOutlineLightningBolt,
  'Digital Appliance': HiOutlineDatabase,
};

const deviceModels = {
  Mobile: {
    Samsung: ['Galaxy S24', 'Galaxy S23', 'Galaxy A54', 'Galaxy Z Fold 5'],
    Apple: ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone SE'],
    Google: ['Pixel 8', 'Pixel 7', 'Pixel 7a'],
    OnePlus: ['12', '11', 'Nord 3'],
    Other: []
  },
  Laptop: {
    Apple: ['MacBook Pro M3', 'MacBook Pro M2', 'MacBook Air M2'],
    Dell: ['XPS 13', 'XPS 15', 'Inspiron 15', 'Latitude 5000'],
    HP: ['Spectre x360', 'Envy 13', 'Pavilion 15', 'EliteBook'],
    Lenovo: ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion 5'],
    Asus: ['ZenBook 14', 'ROG Zephyrus', 'VivoBook'],
    Other: []
  },
  'Home Appliance': {
    LG: ['Washing Machine', 'Refrigerator', 'Microwave', 'Air Conditioner'],
    Samsung: ['Washing Machine', 'Refrigerator', 'Microwave', 'Air Conditioner'],
    Whirlpool: ['Washing Machine', 'Refrigerator', 'Microwave'],
    Bosch: ['Washing Machine', 'Dishwasher'],
    Other: []
  },
  'Digital Appliance': {
    Sony: ['PlayStation 5', 'Bravia TV', 'Home Theater'],
    Microsoft: ['Xbox Series X', 'Xbox Series S'],
    Nintendo: ['Switch OLED', 'Switch'],
    Other: []
  }
};

export default function DeviceFormPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', category_name: '', brand: '', model: '', description: '', location: '' });
  const [mapPosition, setMapPosition] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  const handleCategorySelect = (cat) => {
    setForm({ ...form, category_id: String(cat.id), category_name: cat.name, brand: '', model: '' });
    setIsCustomBrand(false);
    setIsCustomModel(false);
  };

  const handleBrandChange = (e) => {
    const val = e.target.value;
    if (val === 'Other') {
      setIsCustomBrand(true);
      setForm({ ...form, brand: '', model: '' });
    } else {
      setIsCustomBrand(false);
      setForm({ ...form, brand: val, model: '' });
      setIsCustomModel(false);
    }
  };

  const handleModelChange = (e) => {
    const val = e.target.value;
    if (val === 'Other') {
      setIsCustomModel(true);
      setForm({ ...form, model: '' });
    } else {
      setIsCustomModel(false);
      setForm({ ...form, model: val });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImages((prev) => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id) return setError('Please select a category');
    if (!form.brand) return setError('Please provide a brand');
    if (!form.model) return setError('Please provide a model');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => { 
        if (val && key !== 'category_name') {
          formData.append(key, val); 
        }
      });
      if (mapPosition?.lat) formData.append('latitude', mapPosition.lat);
      if (mapPosition?.lng) formData.append('longitude', mapPosition.lng);
      images.forEach((img) => formData.append('images', img));

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

  const availableBrands = form.category_name && deviceModels[form.category_name] ? Object.keys(deviceModels[form.category_name]) : [];
  const availableModels = form.brand && deviceModels[form.category_name] && deviceModels[form.category_name][form.brand] 
    ? [...deviceModels[form.category_name][form.brand], 'Other'] 
    : [];

  return (
    <div className="page-container max-w-2xl">
      <div className="page-header animate-fade-up">
        <h1 className="page-title text-text-primary">List Hardware Item</h1>
        <p className="page-subtitle">Provide device specifications for circular lifecycle assessment and regional matching.</p>
      </div>

      <div className="glass-card p-6 sm:p-8 bg-white border border-border shadow-xs animate-fade-up" style={{ animationDelay: '60ms' }}>
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
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
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2.5 cursor-pointer ${
                      selected
                        ? 'border-primary-700 bg-primary-50 text-primary-700 shadow-xs'
                        : 'border-border bg-white text-text-secondary hover:border-primary-300 hover:bg-surface-lighter'
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
          {form.category_id && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              <div>
                <label className="form-label">Brand</label>
                {availableBrands.length > 0 && !isCustomBrand ? (
                  <select 
                    value={form.brand} 
                    onChange={handleBrandChange} 
                    className="form-input"
                  >
                    <option value="">Select Brand</option>
                    {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter brand name"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="form-input flex-1"
                    />
                    {availableBrands.length > 0 && (
                      <button type="button" onClick={() => setIsCustomBrand(false)} className="px-3 rounded-xl border border-border bg-surface-lighter text-xs">
                        List
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="form-label">Model</label>
                {form.brand && availableModels.length > 1 && !isCustomModel ? (
                  <select 
                    value={form.model} 
                    onChange={handleModelChange} 
                    className="form-input"
                  >
                    <option value="">Select Model</option>
                    {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter model name"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      className="form-input flex-1"
                      disabled={!form.brand && !isCustomBrand}
                    />
                    {form.brand && availableModels.length > 1 && (
                      <button type="button" onClick={() => setIsCustomModel(false)} className="px-3 rounded-xl border border-border bg-surface-lighter text-xs">
                        List
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="form-label">Further Comments</label>
            <textarea
              placeholder="Professionally describe the device condition and any notable issues…"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="form-label !mb-0">Location</label>
              <span className="text-xs text-text-muted">City / Neighborhood</span>
            </div>
            <p className="text-xs text-text-muted mb-2.5">
              Specify your location so local buyers and recyclers can connect with you.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <HiOutlineLocationMarker className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Austin, Texas or click Choose on Map"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="form-input pl-10"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="px-4.5 py-2.5 rounded-full border border-primary-600/30 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs"
              >
                <HiOutlineLocationMarker className="w-4 h-4 text-primary-600" />
                {form.location ? 'Change on Map' : 'Select Location'}
              </button>
            </div>
            {form.location && (
              <div className="mt-2 text-xs text-text-secondary flex items-center gap-1.5">
                <span className="text-emerald-600 font-medium">✓ Location set:</span>
                <span className="font-medium text-text-primary">{form.location}</span>
                {mapPosition && (
                  <span className="text-text-muted">({mapPosition.lat.toFixed(3)}, {mapPosition.lng.toFixed(3)})</span>
                )}
              </div>
            )}
          </div>

          {/* Image Upload (Multi) */}
          <div>
            <label className="form-label">Device Photos</label>
            <p className="text-xs text-text-muted mb-2">Upload multiple angles including any damage (front, back, sides).</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {imagePreviews.length < 4 && (
                <div
                  className="aspect-square border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-600 hover:bg-surface-lighter transition-all duration-200"
                  onClick={() => document.getElementById('imageInput').click()}
                >
                  <HiOutlineUpload className="w-6 h-6 text-text-muted mb-1" />
                  <span className="text-xs text-text-muted">Add Photo</span>
                </div>
              )}
            </div>
            
            <input id="imageInput" type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 !text-[15px]">
            {loading ? 'Creating…' : (
              <>Continue to Assessment <HiOutlineArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialLocationName={form.location}
        onSelectLocation={(locName, coords) => {
          setForm((prev) => ({ ...prev, location: locName }));
          setMapPosition(coords);
        }}
      />
    </div>
  );
}
