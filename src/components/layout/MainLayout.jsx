import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, useToast } from '../ui/toast';
import { useSocket } from '../../hooks/useSocket';
import PushNotificationBanner from '../PushNotificationBanner';
import AIChatWidget from '../AIChatWidget';

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
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        {/* pb-16 on mobile reserves space above the fixed bottom nav */}
        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
      </div>
      <BottomNav />
      <PushNotificationBanner />
      <AIChatWidget />
      <Toaster />
      <ToastViewport />
    </ToastProvider>
  );
}
