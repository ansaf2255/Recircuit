import React from 'react';

export function Button({ 
 children, 
 variant = 'primary', 
 type = 'button', 
 disabled, 
 isLoading,
 className = '',
 ...props 
}) {
 const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-[var(--radius-button)] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 min-h-[44px] px-4';
 
 const variants = {
 primary: 'bg-brand text-white hover:opacity-90',
 ghost: 'bg-surface text-brand border border-brand-ghost hover:bg-brand-tint/30',
 danger: 'bg-danger-bg text-danger-text hover:opacity-90',
 };

 const isDisabled = disabled || isLoading;
 const disabledClasses = isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
 const variantClasses = variants[variant] || variants.primary;

 return (
 <button
 type={type}
 disabled={isDisabled}
 className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
 {...props}
 >
 {isLoading && (
 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 )}
 {children}
 </button>
 );
}
