import React from 'react';
import { Card } from './Card';

export function StatCard({ title, value, icon, className = '' }) {
 return (
 <Card className={`flex flex-col gap-2 ${className}`}>
 <div className="flex items-center gap-2">
 {icon && <span className="text-body-muted">{icon}</span>}
 <h3 className="text-sm font-medium text-body-muted">{title}</h3>
 </div>
 <p className="text-[40px] font-semibold leading-none tracking-tight text-ink">{value}</p>
 </Card>
 );
}
