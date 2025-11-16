
'use client';

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    document.body.classList.add('w-full', 'overflow-x-hidden');
    return () => {
      document.body.classList.remove('w-full', 'overflow-x-hidden');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  return (
    <>
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center">
        <Logo />
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background">
        {children}
      </main>
    </>
  );
}
