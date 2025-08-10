'use client';

import { useAuth } from '@/lib/auth-context';
import { ArrowRightOnRectangleIcon, BuildingOfficeIcon, CalendarIcon, ClockIcon, HomeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Rooms', href: '/meeting-rooms', icon: BuildingOfficeIcon },
  { name: 'Book Room', href: '/booking', icon: CalendarIcon },
  { name: 'History', href: '/history', icon: ClockIcon },
];

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-100">
        <div className="flex items-center justify-between p-4 bg-card shadow">
          <div className="flex items-center">
            <ThemeToggle />
          </div>
          <div className="flex items-center">
            <Link href="/">
              <Image src="/rfl-seeklogo.png" alt="RFL Seek" width={120} height={40} className="h-8 w-auto cursor-pointer" />
            </Link>
          </div>
          <div className="flex items-center">
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground">
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:flex mt-16 lg:mt-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-card shadow-lg">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center">
                <Link href="/">
                  <Image src="/rfl-seeklogo.png" alt="RFL Seek" width={150} height={50} className="h-10 w-auto cursor-pointer" />
                </Link>
              </div>
              <ThemeToggle />
            </div>

            <nav className="flex-1 px-4 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'}`}>
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground">
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8">{children}</main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <nav className="flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`flex-1 flex flex-col items-center py-2 px-1 text-xs ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <item.icon className="h-6 w-6 mb-1" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
