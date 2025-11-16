
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { DashboardSkeleton } from './skeletons/dashboard-skeleton';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);
  
  // This check is now simplified. 
  // If the user data is still loading, show the main dashboard skeleton.
  // Once the user is loaded, the actual page content (or a more specific loading.tsx) will render.
  if (loading || !user) {
    return (
      <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // If a new user lands on a page before their profile is "complete"
  // according to your app's logic, redirect them.
  if (user && !user.profileComplete && pathname !== '/onboarding') {
    router.push('/onboarding');
    return (
       <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // If a user with a complete profile somehow lands on the onboarding page,
  // send them to the dashboard.
  if (user && user.profileComplete && pathname === '/onboarding') {
    router.push('/dashboard');
    return (
       <div className="p-4 sm:p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  return <>{children}</>;
}
