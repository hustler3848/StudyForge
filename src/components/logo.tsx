import { BrainCircuit } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <BrainCircuit className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-headline font-bold text-foreground group-data-[collapsible=icon]:hidden">
        StudyWise AI
      </h1>
    </div>
  );
}
