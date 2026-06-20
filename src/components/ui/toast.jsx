import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]', className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full',
      variant === 'destructive'
        ? 'border-destructive bg-destructive text-destructive-foreground'
        : 'border bg-background text-foreground',
      className
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('absolute right-2 top-2 rounded-md p-1.5 text-foreground/70 opacity-100 transition-colors hover:bg-black/10 hover:text-foreground focus:opacity-100', className)}
    toast-close=""
    {...props}
  >
    <X className="h-5 w-5" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

export { ToastProvider, ToastViewport, Toast, ToastClose, ToastTitle, ToastDescription };

// ── useToast hook ─────────────────────────────────────────────────────────────
const TOAST_LIMIT = 5;
const toastState = { toasts: [], listeners: [] };

let count = 0;
const genId = () => (++count).toString();

const dispatch = (action) => {
  if (action.type === 'ADD') toastState.toasts = [action.toast, ...toastState.toasts].slice(0, TOAST_LIMIT);
  if (action.type === 'REMOVE') toastState.toasts = toastState.toasts.filter((t) => t.id !== action.id);
  if (action.type === 'UPDATE') toastState.toasts = toastState.toasts.map((t) => t.id === action.toast.id ? { ...t, ...action.toast } : t);
  toastState.listeners.forEach((l) => l([...toastState.toasts]));
};

export const toast = ({ title, description, variant }) => {
  const id = genId();
  dispatch({ type: 'ADD', toast: { id, title, description, variant, open: true } });
  setTimeout(() => dispatch({ type: 'REMOVE', id }), 2500);
  return id;
};

export const useToast = () => {
  const [toasts, setToasts] = React.useState([...toastState.toasts]);
  React.useEffect(() => {
    toastState.listeners.push(setToasts);
    return () => { toastState.listeners = toastState.listeners.filter((l) => l !== setToasts); };
  }, []);
  return { toasts, toast, dismiss: (id) => dispatch({ type: 'REMOVE', id }) };
};
