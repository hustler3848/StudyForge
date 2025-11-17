import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

export function Logo({ className }: { className?: string }) {
  let state: 'expanded' | 'collapsed' | undefined;
  try {
    // This will throw an error if not within a SidebarProvider
    const sidebar = useSidebar();
    state = sidebar.state;
  } catch (error) {
    // Gracefully handle the error when Logo is used outside of a Sidebar context
    state = undefined;
  }
  
  const isCollapsed = state === 'collapsed';

  return (
    <div className={cn("flex items-center gap-3 whitespace-nowrap overflow-hidden", className)}>
      <BrainCircuit className="h-6 w-6 text-foreground flex-shrink-0" />
      <h1 className={cn("text-lg font-bold text-foreground transition-opacity duration-300 ease-in-out",
        isCollapsed && "opacity-0"
      )}>
        StudyWise AI
      </h1>
    </div>
  );
}
