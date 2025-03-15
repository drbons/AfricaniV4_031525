import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CategoryMenu from '@/components/features/CategoryMenu';
import CreatePostButton from '@/components/features/CreatePostButton';

export const metadata = {
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
      <body suppressHydrationWarning={true} className="font-inter bg-[#F5F5F7] min-h-screen flex flex-col">
        <Header />
        <CategoryMenu />
        
        <div className="flex-1 flex">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
        
        <Footer />
        <CreatePostButton />
      </body>
    </html>
  );
}