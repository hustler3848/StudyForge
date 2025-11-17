
"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ChevronLeft, ChevronRight, Settings, Users, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './tooltip';
import { navItems } from '@/app/(app)/layout';
import { Logo } from '../logo';


interface NavLinksProps {
    isCollapsed: boolean;
}

export function NavLinks({ isCollapsed }: NavLinksProps) {
    const pathname = usePathname();

    return (
        <TooltipProvider delayDuration={0}>
            {navItems.map(({ href, label, icon: Icon }) => (
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
                "hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out fixed h-full z-50",
                isCollapsed ? "w-20" : "w-60"
            )}>
                <div className="h-16 flex items-center border-b px-6 relative">
                     <Logo isCollapsed={isCollapsed} />
                </div>
                
                <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                    <nav className="px-4 py-4 space-y-1">
                       <NavLinks isCollapsed={isCollapsed} />
                    </nav>
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
                </div>


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
