import React from 'react';

export function Card({ children, compact = false, className = '', ...props }) {
 const paddingClass = compact ? 'p-[16px]' : 'p-[24px]';
 return (
 <div 
 className={`bg-surface border border-line rounded-[var(--radius-card)] ${paddingClass} ${className}`}
 {...props}
 >
 {children}
 </div>
 );
}
