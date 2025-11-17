
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

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    // If user is not logged in and not on an auth page, redirect to login
    if (!user && !isAuthPage) {
      router.push('/login');
      return;
    }

    // If user is logged in and on an auth page, redirect to dashboard
    if (user && isAuthPage) {
      router.push('/dashboard');
      return;
    }
    
    // If user is logged in, but profile is not complete, redirect to onboarding
    if (user && !user.profileComplete && pathname !== '/onboarding') {
      router.push('/onboarding');
      return;
    }

  }, [user, loading, router, pathname]);
  
  // While loading, show a skeleton UI
  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }
  
  // If we are on a public page or the user is authenticated, show the children
  return <>{children}</>;
}
