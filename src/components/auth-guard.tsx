
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSkeleton } from './skeletons/dashboard-skeleton';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }

    const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/login');

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user) {
      if (!user.profileComplete && pathname !== '/onboarding') {
        router.push('/onboarding');
      } else if (user.profileComplete && (isAuthPage || pathname === '/onboarding')) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router, pathname]);
  
  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }
  
  const isAuthPage = pathname.startsWith('/signin') || pathname.startsWith('/signup') || pathname.startsWith('/login');
  
  // Render children if rules are met, otherwise render skeleton while redirecting
  if (!user && isAuthPage) {
    return <>{children}</>;
  }
  
  if (user && !user.profileComplete && pathname === '/onboarding') {
    return <>{children}</>;
  }
  
  if (user && user.profileComplete && !isAuthPage && pathname !== '/onboarding') {
    return <>{children}</>;
  }

  // Fallback skeleton while routing logic catches up
  return (
    <div className="p-4 sm:p-6">
      <DashboardSkeleton />
    </div>
  );
}
