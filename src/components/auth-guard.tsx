
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 flex flex-col items-center">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32 mt-4" />
        </div>
      </div>
    );
  }

  // New check for profile completion - redirect away from onboarding if somehow landed there
  if (user && user.profileComplete) {
    if (pathname === '/onboarding') {
      router.push('/dashboard');
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="space-y-4 flex flex-col items-center">
              <Skeleton className="h-12 w-48" />
              <p>Redirecting to dashboard...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
