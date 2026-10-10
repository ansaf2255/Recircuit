import React from 'react';

export function FormField({ label, error, children, className = '' }) {
 // Generate a random ID if tying label to input is needed, but we can also just wrap it or let parent handle id
 return (
 <div className={`flex flex-col gap-1.5 ${className}`}>
 {label && <label className="text-sm font-medium text-ink">{label}</label>}
 {children}
 {error && <span className="text-sm text-danger-text">{error}</span>}
 </div>
 );
}

const inputClasses = "w-full min-h-[44px] px-3 py-2 bg-surface border border-line-input rounded-[var(--radius-input)] text-ink placeholder:text-body-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow disabled:bg-placeholder disabled:cursor-not-allowed";

export function Input({ className = '', ...props }) {
 return <input className={`${inputClasses} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
 return <textarea className={`min-h-[100px] py-3 ${inputClasses} ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
 return (
 <select className={`${inputClasses} appearance-none pr-8 bg-no-repeat bg-[right_12px_center] bg-[length:16px_16px] ${className}`} style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\\\'http://www.w3.org/2000/svg\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'none\\\' stroke=\\\'currentColor\\\' stroke-width=\\\'2\\\' stroke-linecap=\\\'round\\\' stroke-linejoin=\\\'round\\\'%3E%3Cpolyline points=\\\'6 9 12 15 18 9\\\'/%3E%3C/svg%3E")' }} {...props}>
 {children}
 </select>
 );
}
