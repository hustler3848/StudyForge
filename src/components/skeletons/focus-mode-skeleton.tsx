
import { Skeleton } from '@/components/ui/skeleton';

export const FocusModeSkeleton = () => {
  return (
    <div className="flex justify-center items-center h-[70vh]">
      <div className="w-full max-w-md space-y-8">
        <Skeleton className="h-12 w-1/2 mx-auto" />
        <Skeleton className="h-32 w-3/4 mx-auto" />
        <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-36" />
        </div>
      </div>
    </div>
  );
};
