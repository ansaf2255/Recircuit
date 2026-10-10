import React from 'react';

export function SegmentedToggle({ options, activeValue, onChange, className = '' }) {
 return (
 <div className={`inline-flex bg-surface p-1 rounded-full border border-line ${className}`}>
 {options.map((opt) => {
 const isActive = activeValue === opt.value;
 return (
 <button
 key={opt.value}
 type="button"
 onClick={() => onChange(opt.value)}
 className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
 isActive ? 'bg-brand text-white shadow-sm' : 'text-body-muted hover:text-ink'
 }`}
 >
 {opt.label}
 </button>
 );
 })}
 </div>
 );
}
