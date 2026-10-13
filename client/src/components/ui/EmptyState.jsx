import React from 'react';
import { Card } from './Card';

export function EmptyState({ icon, title, description, action, className = '' }) {
 return (
 <Card className={`flex flex-col items-center justify-center text-center py-12 ${className}`}>
 {icon && <div className="text-4xl mb-4 text-placeholder">{icon}</div>}
 <h3 className="text-xl font-bold text-ink mb-2 font-heading">{title}</h3>
 {description && <p className="text-sm text-body-muted max-w-sm mb-6">{description}</p>}
 {action && <div>{action}</div>}
 </Card>
 );
}
