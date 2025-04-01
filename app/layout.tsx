import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import ToastProvider from '@/components/shared/ToastProvider';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'African Business Directory',
  description: 'Connect with African businesses across the United States',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className="font-sans bg-[#F5F5F7] min-h-screen flex flex-col">
        <AuthProvider>
          <ErrorBoundary>
            <ToastProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-col flex-1 overflow-x-hidden">
                  <Header />
                  <main className="flex-1">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            </ToastProvider>
          </ErrorBoundary>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}