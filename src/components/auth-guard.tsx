
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
    if (!loading && !user) {
      // If not loading and no user, redirect to signin
      if (pathname !== '/signin' && pathname !== '/signup') {
        router.push('/signin');
      }
    }
    
    if (!loading && user) {
        // If user profile is not complete, redirect to onboarding
        if (!user.profileComplete && pathname !== '/onboarding') {
            router.push('/onboarding');
        }
        // If profile is complete but they are on an auth or onboarding page, redirect to dashboard
        else if (user.profileComplete && (pathname === '/onboarding' || pathname === '/signin' || pathname === '/signup')) {
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

  // If we are on an auth page, and we are not logged in, render the page.
  if (!user && (pathname === '/signin' || pathname === '/signup')) {
      return <>{children}</>;
  }
  
  // If we have a user and they are on the right page, render children
  if (user) {
    if (!user.profileComplete && pathname === '/onboarding') {
        return <>{children}</>;
    }
    if (user.profileComplete && pathname !== '/onboarding' && pathname !== '/signin' && pathname !== '/signup') {
        return <>{children}</>;
    }
  }

  // Fallback while routing takes place
  return (
      <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
}
