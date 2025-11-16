import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 whitespace-nowrap", className)}>
      <BrainCircuit className="h-6 w-6 bg-gradient-to-r from-indigo-500 to-blue-400 text-transparent bg-clip-text" />
      <h1 className="text-xl font-headline font-bold bg-gradient-to-r from-indigo-500 to-blue-400 text-transparent bg-clip-text group-data-[collapsible=icon]:hidden">
        StudyWise AI
      </h1>
    </div>
  );
}
