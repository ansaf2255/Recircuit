import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
 const [toasts, setToasts] = useState([]);

 const addToast = useCallback((message, type = 'error') => {
 const id = Date.now();
 setToasts((prev) => [...prev, { id, message, type }]);
 setTimeout(() => {
 setToasts((prev) => prev.filter((t) => t.id !== id));
 }, 5000);
 }, []);

 return (
 <ToastContext.Provider value={{ addToast }}>
 {children}
 <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
 {toasts.map((t) => {
 const isError = t.type === 'error';
 return (
 <div
 key={t.id}
 className="px-4 py-3 bg-surface border border-line rounded-lg shadow-lg text-sm font-medium toast-enter flex items-center gap-3 min-w-[300px]"
 >
 {isError ? (
 <div className="w-8 h-8 rounded-full bg-danger-bg flex items-center justify-center flex-shrink-0 text-danger-text">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
 </div>
 ) : (
 <div className="w-8 h-8 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0 text-success-text">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
 </div>
 )}
 <span className="text-ink">{t.message}</span>
 </div>
 );
 })}
 </div>
 </ToastContext.Provider>
 );
}

export const useToast = () => useContext(ToastContext);
