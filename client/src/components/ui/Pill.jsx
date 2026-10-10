import React from 'react';

export function PillGroup({ children, className = '' }) {
 return <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>;
}

export function Pill({ active = false, onClick, children, className = '' }) {
 const activeClass = active 
 ? 'bg-brand text-white border-brand' 
 : 'bg-surface text-ink border-line-pill hover:bg-brand-tint hover:border-brand-tint';
 
 return (
 <button
 type="button"
 onClick={onClick}
 className={`inline-flex items-center px-4 py-1.5 min-h-[32px] text-sm font-medium border rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${activeClass} ${className}`}
 >
 {children}
 </button>
 );
}
