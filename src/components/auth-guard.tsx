
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
    const isPublicPage = isAuthPage || pathname === '/' || pathname === '/onboarding';

    // If user is not logged in and not on a public page, redirect to login
    if (!user && !isPublicPage) {
      router.push('/login');
      return;
    }

    // If user is logged in...
    if (user) {
        // and on an auth page, redirect to dashboard
        if (isAuthPage) {
            router.push('/dashboard');
            return;
        }
        // but profile is not complete, redirect to onboarding (unless already there)
        if (!user.profileComplete && pathname !== '/onboarding') {
            router.push('/onboarding');
            return;
        }
    }

  }, [user, loading, router, pathname]);
  
  // While loading auth state on a protected route, show a skeleton UI
  if (loading && pathname !== '/') {
    return (
      <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }
  
  // Render children
  return <>{children}</>;
}
