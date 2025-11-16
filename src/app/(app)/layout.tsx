
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  LogOut,
  FileText,
  Book,
  Clock,
  CalendarDays,
  Sun,
  Moon,
  ChevronLeft,
  Settings
} from 'lucide-react';
import { Logo } from '@/components/logo';
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
import { useSidebar } from '@/components/ui/sidebar';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/study-plan', label: 'My Plan', icon: CalendarDays },
  { href: '/essay-review', label: 'Essay Review', icon: FileText },
  { href: '/flashcards', label: 'Flashcards', icon: Book },
  { href: '/focus-mode', label: 'Focus Mode', icon: Clock },
];

function SidebarToggleButton() {
    const { toggleSidebar } = useSidebar();
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
            "rounded-full h-8 w-8 bg-background absolute -right-4 top-1/2 -translate-y-1/2 z-50 border transition-all",
            "group-data-[collapsible=icon]:rotate-180"
        )}
        onClick={toggleSidebar}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <Sidebar collapsible="icon" variant="sidebar" side="left">
          <SidebarToggleButton />
          <SidebarHeader>
             <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.href)}
                        tooltip={item.label}
                    >
                        <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="#">
                    <Settings/>
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6">
              <SidebarTrigger className="md:hidden"/>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
