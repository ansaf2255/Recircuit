import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { HiOutlineSearch, HiOutlineX, HiOutlineLocationMarker, HiCheck, HiOutlineRefresh } from 'react-icons/hi';

// Crisp Google Maps-style pin icon using SVG
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-location-pin',
    html: `
      <div style="position: relative; width: 36px; height: 48px; transform: translate(-18px, -48px); cursor: grab;">
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.35));">
          <path d="M18 0C8.05887 0 0 8.05887 0 18C0 29.5 15.5 46.2 16.8 47.6C17.4 48.2 18.6 48.2 19.2 47.6C20.5 46.2 36 29.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#1a73e8"/>
          <circle cx="18" cy="18" r="7" fill="#ffffff"/>
          <circle cx="18" cy="18" r="3.5" fill="#1a73e8"/>
        </svg>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
  });
};

function formatAddress(data) {
  if (!data) return '';
  const addr = data.address || {};
  
  const local = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || addr.road;
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.county;
  const state = addr.state || addr.state_district;
  const country = addr.country;

  const parts = [];
  if (local && local !== city) parts.push(local);
  if (city) parts.push(city);
  if (state && state !== city) parts.push(state);
  if (country) parts.push(country);

  if (parts.length > 0) {
    return parts.slice(0, 3).join(', ');
  }

  if (data.display_name) {
    return data.display_name.split(',').slice(0, 3).join(', ').trim();
  }
  return '';
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocationName = '',
}) {
  const defaultPos = { lat: 12.9716, lng: 77.5946 };
  const [position, setPosition] = useState(defaultPos);
  const [resolvedName, setResolvedName] = useState(initialLocationName || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [searchError, setSearchError] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const pinIcon = useMemo(() => createPinIcon(), []);

  // Reverse Geocoding
  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Failed to resolve address');
      const data = await res.json();
      const formatted = formatAddress(data);
      if (formatted) {
        setResolvedName(formatted);
      } else {
        setResolvedName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
      setResolvedName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsResolving(false);
    }
  }, []);

  // Update map view & marker when position changes
  const updateMapMarker = useCallback((lat, lng, fly = true) => {
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current && fly) {
      mapInstanceRef.current.flyTo([lat, lng], Math.max(mapInstanceRef.current.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, []);

  // Initialize pure Leaflet map on mount when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: [position.lat, position.lng],
        zoom: 13,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([position.lat, position.lng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const newPos = marker.getLatLng();
        setPosition(newPos);
        reverseGeocode(newPos.lat, newPos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setPosition(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      // Initial geolocation if no name specified
      if (initialLocationName) {
        setResolvedName(initialLocationName);
        searchLocation(initialLocationName, true);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPosition(userCoords);
            updateMapMarker(userCoords.lat, userCoords.lng, true);
            reverseGeocode(userCoords.lat, userCoords.lng);
          },
          () => {
            reverseGeocode(position.lat, position.lng);
          },
          { timeout: 5000 }
        );
      } else {
        reverseGeocode(position.lat, position.lng);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Search places via Nominatim
  const searchLocation = async (queryText, silent = false) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;

    if (!silent) setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();
      
      if (results && results.length > 0) {
        setSearchResults(results);
        if (silent) {
          const top = results[0];
          const newPos = { lat: parseFloat(top.lat), lng: parseFloat(top.lon) };
          setPosition(newPos);
          updateMapMarker(newPos.lat, newPos.lng, true);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        if (!silent) setSearchError('No matching places found. Try another search.');
      }
    } catch (err) {
      console.error('Search error:', err);
      if (!silent) setSearchError('Unable to search locations right now.');
    } finally {
      if (!silent) setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item) => {
    const newPos = { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };
    setPosition(newPos);
    updateMapMarker(newPos.lat, newPos.lng, true);
    const formatted = formatAddress(item);
    setResolvedName(formatted || item.display_name.split(',')[0]);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (resolvedName) {
      onSelectLocation(resolvedName, position);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-text-primary">Choose Location</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Search your neighborhood or drag the marker to your precise area
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-lighter transition-colors cursor-pointer"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border/60 bg-surface/50 relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchLocation();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search city, area, street, or landmark…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (searchError) setSearchError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-full text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-full bg-primary-700 hover:bg-primary-800 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </form>

          {/* Search Error */}
          {searchError && (
            <p className="text-xs text-rose-600 mt-2 px-1">{searchError}</p>
          )}

          {/* Autocomplete / Results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-xl border border-border z-1000 max-h-60 overflow-y-auto divide-y divide-border/60">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-4 py-3 hover:bg-primary-50/60 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <HiOutlineLocationMarker className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {item.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-text-muted line-clamp-1">
                      {item.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pure Leaflet Map Container */}
        <div className="relative flex-1 min-h-[340px] sm:min-h-[400px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[340px] sm:min-h-[400px] z-0" />

          {/* Pin drag guide badge overlay */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-400 bg-white/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-sm border border-border/80 text-[11px] text-text-secondary flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
            Click anywhere or drag the pin to adjust location
          </div>
        </div>

        {/* Selected Location Footer Display */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface-lighter flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              <span>Selected Location</span>
              {isResolving && (
                <div className="inline-flex items-center gap-1 text-primary-600 font-normal lowercase">
                  <HiOutlineRefresh className="w-3.5 h-3.5 animate-spin" /> resolving…
                </div>
              )}
            </div>
            <p className="text-sm sm:text-base font-medium text-text-primary truncate mt-0.5">
              {resolvedName || 'Click the map to choose a location'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Coords: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-border text-text-secondary hover:bg-surface font-medium text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!resolvedName || isResolving}
              className="px-6 py-2.5 rounded-full bg-primary-700 hover:bg-primary-800 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <HiCheck className="w-4 h-4" /> Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
