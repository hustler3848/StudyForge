
import { Skeleton } from '@/components/ui/skeleton';

export const FlashcardsSkeleton = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    </div>
  );
};
