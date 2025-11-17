
import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ isCollapsed, className }: { isCollapsed?: boolean, className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 overflow-hidden", className)}>
      <BrainCircuit className="h-6 w-6 text-primary flex-shrink-0" />
      <span className={cn(
          "font-bold font-headline whitespace-nowrap transition-opacity duration-200",
          isCollapsed ? "opacity-0" : "opacity-100"
      )}>
        StudyForge
      </span>
    </div>
  );
}
