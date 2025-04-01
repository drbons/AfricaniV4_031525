import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | African Business',
  description: 'View and manage your notifications',
};

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 