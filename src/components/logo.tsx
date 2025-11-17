import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

export function Logo({ className }: { className?: string }) {
  const { state } = useSidebar();
  return (
    <div className={cn("flex items-center gap-3 whitespace-nowrap overflow-hidden", className)}>
      <BrainCircuit className="h-6 w-6 text-foreground flex-shrink-0" />
      <h1 className={cn("text-lg font-bold text-foreground transition-opacity duration-300 ease-in-out",
        "group-data-[state=collapsed]/sidebar-wrapper:opacity-0"
      )}>
        StudyWise AI
      </h1>
    </div>
  );
}
