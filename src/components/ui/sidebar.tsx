
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';
import { navSections } from '@/app/(app)/layout';
import { Logo } from '../logo';
import { Separator } from './separator';

interface NavLink {
    href: string;
    label: string;
    icon: React.ElementType;
}
interface NavSection {
    title: string;
    items: NavLink[];
}

interface NavLinksProps {
    sections: NavSection[];
    isCollapsed: boolean;
}

export function NavLinks({ sections, isCollapsed }: NavLinksProps) {
    const pathname = usePathname();

    return (
        <TooltipProvider delayDuration={0}>
            {sections.map(section => (
                section.items.map(({ href, label, icon: Icon }) => (
                    <Tooltip key={href}>
                        <TooltipTrigger asChild>
                            <Button
                                asChild
                                variant={pathname.startsWith(href) ? 'secondary' : 'ghost'}
                                className={cn(
                                    "w-full justify-start h-10",
                                    isCollapsed ? "justify-center px-0" : "px-3"
                                )}
                            >
                                <Link href={href}>
                                    <Icon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                                    <span className={cn("truncate", isCollapsed && "sr-only")}>{label}</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right" className="ml-2">
                                {label}
                            </TooltipContent>
                        )}
                    </Tooltip>
                ))
            ))}
        </TooltipProvider>
    )
}

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
    return (
        <TooltipProvider delayDuration={0}>
            <aside className={cn(
                "hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out fixed h-full z-40",
                isCollapsed ? "w-20" : "w-60"
            )}>
                <div className="h-16 flex items-center border-b px-6">
                     <Logo isCollapsed={isCollapsed} />
                </div>
                
                <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                    <nav className="px-4 py-4 space-y-2">
                        {navSections.map((section, index) => (
                           <div key={section.title} className="space-y-1">
                               {index > 0 && <Separator className="my-2" />}
                               {!isCollapsed && section.title !== 'General' && (
                                   <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                       {section.title}
                                   </h4>
                               )}
                               <NavLinks sections={[section]} isCollapsed={isCollapsed} />
                           </div>
                        ))}
                    </nav>
                </div>

                <nav className="px-4 py-4 space-y-1 border-t mt-auto">
                    <Tooltip>
                        <TooltipTrigger asChild>
                                <Button asChild variant="ghost" className={cn("w-full justify-start h-10", isCollapsed ? "justify-center px-0" : "px-3")}>
                                <Link href="/settings">
                                    <Settings className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                                    <span className={cn(isCollapsed && "sr-only")}>Settings</span>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        {isCollapsed && (
                            <TooltipContent side="right" className="ml-2">Settings</TooltipContent>
                        )}
                    </Tooltip>
                </nav>


                <div className="absolute top-1/2 -right-[13px] z-10 -translate-y-1/2">
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                onClick={toggleSidebar} 
                                className="h-7 w-7 bg-background hover:bg-muted text-muted-foreground rounded-full border flex items-center justify-center cursor-pointer"
                            >
                                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                <span className="sr-only">Toggle sidebar</span>
                            </button>
                        </TooltipTrigger>
                         <TooltipContent side="right" className="ml-2">
                            {isCollapsed ? 'Expand' : 'Collapse'}
                         </TooltipContent>
                     </Tooltip>
                </div>
            </aside>
        </TooltipProvider>
    );
}
