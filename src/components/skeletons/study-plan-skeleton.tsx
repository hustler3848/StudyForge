
import { Skeleton } from '@/components/ui/skeleton';

export const StudyPlanSkeleton = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
      <div className="lg:col-span-2">
        <Skeleton className="h-[80vh] w-full rounded-xl" />
      </div>
    </div>
  );
};
