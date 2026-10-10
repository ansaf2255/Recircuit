import React from 'react';

export function Chip({ outcome, label, className = '' }) {
 const outcomeStyles = {
 reuse: 'bg-reuse-bg text-reuse-fg',
 resell: 'bg-resell-bg text-resell-fg',
 refurbish: 'bg-refurbish-bg text-refurbish-fg',
 recycle: 'bg-recycle-bg text-recycle-fg',
 };

 const styleClass = outcomeStyles[outcome?.toLowerCase()] || 'bg-placeholder text-ink';

 return (
 <span className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-full ${styleClass} ${className}`}>
 {label || outcome}
 </span>
 );
}

export function StatusBadge({ status, label, className = '' }) {
 const statusStyles = {
 pending: 'bg-warning-bg text-warning-text',
 accepted: 'bg-info-bg text-info-text',
 completed: 'bg-success-bg text-success-text',
 cancelled: 'bg-danger-bg text-danger-text',
 delivered: 'bg-success-bg text-success-text',
 'order claimed': 'bg-warning-bg text-warning-text',
 };

 const styleClass = statusStyles[status?.toLowerCase()] || 'bg-placeholder text-ink';

 return (
 <span className={`inline-flex items-center justify-center px-3 py-1 text-sm font-medium rounded-full ${styleClass} ${className}`}>
 {label || status}
 </span>
 );
}
