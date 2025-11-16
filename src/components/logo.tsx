import { BrainCircuit } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <BrainCircuit className="h-6 w-6 bg-gradient-to-r from-indigo-500 to-blue-400 text-transparent bg-clip-text" />
      <h1 className="text-xl font-headline font-bold bg-gradient-to-r from-indigo-500 to-blue-400 text-transparent bg-clip-text group-data-[collapsible=icon]:hidden">
        StudyWise AI
      </h1>
    </div>
  );
}
