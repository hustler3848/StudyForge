import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 whitespace-nowrap overflow-hidden", className)}>
      <BrainCircuit className="h-6 w-6 text-primary flex-shrink-0" />
      <h1 className="text-xl font-headline font-bold text-foreground transition-opacity duration-300 group-data-[collapsible=icon]:opacity-0">
        StudyWise AI
      </h1>
    </div>
  );
}
