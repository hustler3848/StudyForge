
import { Skeleton } from '@/components/ui/skeleton';

export const SettingsSkeleton = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="space-y-8">
            <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};
