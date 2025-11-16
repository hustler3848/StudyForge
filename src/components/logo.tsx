import { GraduationCap } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-headline font-bold text-foreground">
        StudyWise AI
      </h1>
    </div>
  );
}
