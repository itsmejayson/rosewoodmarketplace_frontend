import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, useToast } from '../ui/toast';
import { useSocket } from '../../hooks/useSocket';

function Toaster() {
  const { toasts } = useToast();
  return (
    <>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast key={id} open={open} variant={variant}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </>
  );
}

function SocketProvider() {
  useSocket();
  return null;
}

export default function MainLayout() {
  return (
    <ToastProvider>
      <SocketProvider />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
      <ToastViewport />
    </ToastProvider>
  );
}
