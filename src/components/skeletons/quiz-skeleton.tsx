import { Skeleton } from '@/components/ui/skeleton';

export const QuizSkeleton = () => {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
       <Skeleton className="h-12 w-full" />
    </div>
  );
};
