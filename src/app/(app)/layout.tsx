'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, NavLinks } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LogOut,
  Sun,
  Moon,
  Settings,
  Sparkles,
  LayoutDashboard,
  CalendarCheck,
  FileSignature,
  Layers,
  Hourglass,
  Users,
  Target,
  TestTube2,
  Menu,
} from 'lucide-react';
import AuthGuard from '@/components/auth-guard';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export const navSections = [
  {
    title: "General",
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/community', label: 'Community', icon: Users },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: '/ai-readiness', label: 'AI Readiness', icon: Target },
      { href: '/study-plan', label: 'My Plan', icon: CalendarCheck },
      { href: '/essay-review', label: 'Essay Review', icon: FileSignature },
      { href: '/flashcards', label: 'Flashcards', icon: Layers },
      { href: '/quiz', label: 'Quick Quiz', icon: TestTube2 },
      { href: '/focus-mode', label: 'Focus Mode', icon: Hourglass },
    ]
  }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
          <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
          
          <div className={cn(
              "flex-1 flex flex-col transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "ml-0 md:ml-20" : "ml-0 md:ml-60"
          )}>
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[240px] p-0">
                     <div className="h-16 flex items-center border-b px-6">
                       <Logo />
                    </div>
                    <nav className="p-4 space-y-2">
                      {navSections.map((section, sectionIndex) => (
                        <div key={section.title}>
                          {sectionIndex > 0 && <Separator className="my-2" />}
                           {section.title !== 'General' && (
                             <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {section.title}
                            </h4>
                          )}
                          <div className="space-y-1">
                            <NavLinks sections={[section]} isCollapsed={false} />
                          </div>
                        </div>
                      ))}
                    </nav>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                  <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                           <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                         </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      {user?.studyStreak && user.studyStreak > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem disabled>
                             <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-orange-400" />
                              <span className="font-semibold">{user.studyStreak}-day</span>
                              <span className="text-muted-foreground">Study Streak!</span>
                             </div>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6">{children}</main>
          </div>
        </div>
    </AuthGuard>
  );
}
