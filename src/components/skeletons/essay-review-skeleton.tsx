
import { Skeleton } from '@/components/ui/skeleton';

export const EssayReviewSkeleton = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};
