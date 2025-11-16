"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.profileComplete) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

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
