import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ isOpen, onClose, title, children, className = '' }) {
 useEffect(() => {
 const handleEsc = (e) => {
 if (e.key === 'Escape') onClose();
 };
 if (isOpen) {
 document.addEventListener('keydown', handleEsc);
 document.body.style.overflow = 'hidden';
 }
 return () => {
 document.removeEventListener('keydown', handleEsc);
 document.body.style.overflow = 'unset';
 };
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 return createPortal(
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/40 animate-in fade-in duration-200">
 <div className="absolute inset-0" onClick={onClose}></div>
 <div 
 className={`relative w-full max-w-lg bg-surface rounded-[var(--radius-card)] shadow-xl animate-in zoom-in-95 duration-200 ${className}`}
 role="dialog"
 aria-modal="true"
 aria-labelledby="modal-title"
 >
 <div className="flex items-center justify-between p-6 border-b border-line">
 <h2 id="modal-title" className="text-xl font-semibold text-ink">{title}</h2>
 <button 
 onClick={onClose}
 className="p-2 text-body-muted hover:bg-placeholder rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
 aria-label="Close modal"
 >
 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
 </button>
 </div>
 <div className="p-6 overflow-y-auto max-h-[calc(100vh-150px)]">
 {children}
 </div>
 </div>
 </div>,
 document.body
 );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'primary', isLoading = false }) {
 return (
 <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
 <p className="text-body-muted mb-6">{message}</p>
 <div className="flex justify-end gap-3">
 <button 
 onClick={onClose} 
 disabled={isLoading}
 className="px-4 py-2 text-sm font-medium text-ink bg-surface border border-line-pill rounded-full hover:bg-placeholder transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
 >
 {cancelText}
 </button>
 <button 
 onClick={onConfirm}
 disabled={isLoading}
 className={`px-4 py-2 text-sm font-medium text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${variant === 'danger' ? 'bg-danger-text hover:opacity-90' : 'bg-brand hover:opacity-90'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
 >
 {confirmText}
 </button>
 </div>
 </Modal>
 );
}
