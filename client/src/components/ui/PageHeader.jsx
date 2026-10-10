import React from 'react';

export function PageHeader({ title, subtitle, action, className = '' }) {
 return (
 <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ${className}`}>
 <div>
 <h1 className="text-[40px] font-semibold tracking-tight text-ink mb-1">{title}</h1>
 {subtitle && <p className="text-[15px] text-body-muted">{subtitle}</p>}
 </div>
 {action && <div>{action}</div>}
 </div>
 );
}
