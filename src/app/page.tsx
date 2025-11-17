
"use client";

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import {
  CalendarCheck,
  FileSignature,
  Layers,
  BarChart,
  CheckCircle,
  Sun,
  Moon,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.2
    }
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
];

const Header = () => {
  const { setTheme, theme } = useTheme();
  const { user, loading } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <motion.div 
        className="container flex h-16 max-w-7xl items-center"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="flex items-center gap-6 mr-auto">
          <motion.div variants={itemVariants}>
            <Logo />
          </motion.div>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
                 <motion.div variants={itemVariants} key={link.href}>
                    <Link
                        href={link.href}
                        className="text-foreground/60 transition-colors hover:text-foreground/80"
                    >
                        {link.label}
                    </Link>
                 </motion.div>
            ))}
          </nav>
        </div>

        {/* Desktop nav */}
        <motion.div className="hidden md:flex flex-1 items-center justify-end space-x-2" variants={sectionVariants}>
          <motion.div variants={itemVariants}>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </motion.div>
            {!loading && user ? (
                <motion.div variants={itemVariants}>
                <Link
                    href="/dashboard"
                    className={cn(
                    buttonVariants({ variant: 'default' }),
                    'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow'
                    )}
                >
                    Dashboard
                </Link>
                </motion.div>
            ) : (
                <>
                <motion.div variants={itemVariants}>
                    <Link
                        href="/login"
                        className={cn(buttonVariants({ variant: 'ghost' }))}
                    >
                        Login
                    </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Link
                    href="/signup"
                    className={cn(
                        buttonVariants({ variant: 'default' }),
                        'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow'
                    )}
                    >
                    Get Started
                    </Link>
                </motion.div>
                </>
            )}
        </motion.div>
        
        {/* Mobile nav */}
        <div className="md:hidden ml-auto">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu />
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px]">
                    <nav className="flex flex-col gap-6 text-lg font-medium mt-10">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="text-foreground/80 hover:text-foreground transition-colors">{link.label}</Link>
                        ))}
                         <div className="mt-auto space-y-4">
                            {!loading && user ? (
                                <Link
                                    href="/dashboard"
                                    className={cn(
                                    buttonVariants({ size: 'lg' }),
                                    'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow w-full'
                                    )}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                <Link
                                    href="/login"
                                    className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'w-full')}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className={cn(
                                        buttonVariants({ size: 'lg' }),
                                        'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow w-full'
                                    )}
                                    >
                                    Get Started
                                </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </SheetContent>
            </Sheet>
        </div>


      </motion.div>
    </header>
  );
};

const HeroSection = () => (
  <section className="py-20 md:py-32">
    <div className="container grid md:grid-cols-2 gap-12 items-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="flex flex-col gap-6 text-center md:text-left items-center md:items-start"
      >
        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter font-headline">
          <span className="bg-gradient-to-r from-sky-500 to-blue-400 text-transparent bg-clip-text">
            Learn Smarter.
          </span>
          <br />
          Study Faster.
        </motion.h1>
        <motion.p variants={itemVariants} className="max-w-xl text-lg text-muted-foreground">
          Your personal AI tutor that creates adaptive study plans, generates
          flashcards, analyzes essays, and tracks your progress — automatically.
        </motion.p>
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/signup"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow'
            )}
          >
            Get Started
          </Link>
        </motion.div>
      </motion.div>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative w-full max-w-2xl mx-auto aspect-video"
      >
         <Image
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="StudyForge Dashboard"
            fill
            className="object-cover rounded-2xl border bg-background/50 p-2 shadow-2xl shadow-blue-500/10"
            priority
            data-ai-hint="study books"
         />
      </motion.div>
    </div>
  </section>
);

const TrustedSection = () => (
  <motion.section
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={sectionVariants}
    className="py-8 bg-secondary/50"
  >
    <div className="container text-center">
      <p className="text-sm uppercase text-muted-foreground font-semibold tracking-wider">
        Used by students preparing for
      </p>
      <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-2 mt-4 font-semibold text-muted-foreground/80">
        <span>USMLE</span>
        <span>JEE</span>
        <span>SAT</span>
        <span>A Levels</span>
        <span>University Exams</span>
      </div>
    </div>
  </motion.section>
);

const features = [
  {
    icon: CalendarCheck,
    title: 'Smart Study Plan',
    description:
      'Creates a personalized daily schedule using your free time, subjects, tasks, and goals.',
    color: 'blue',
  },
  {
    icon: Layers,
    title: 'Flashcard Generator',
    description:
      'Turns your notes, PDFs, or even photos of notes into smart flashcards automatically.',
    color: 'sky',
  },
  {
    icon: FileSignature,
    title: 'Essay Analyzer',
    description:
      'Grades your essay on grammar, clarity, and structure, then provides a corrected rewrite.',
    color: 'purple',
  },
  {
    icon: BarChart,
    title: 'Learning Analytics',
    description:
      'Simple progress insights like study streaks and mastered cards to keep you motivated.',
    color: 'green',
  },
];

const FeatureShowcaseSection = () => (
  <motion.section
    id="features"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={sectionVariants}
    className="py-20 md:py-28"
  >
    <div className="container">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-extrabold font-headline">
          A Smarter Way to Study
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Stop guessing. Start learning with AI-powered tools designed for
          academic success.
        </p>
      </div>
      <motion.div 
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={itemVariants}
          >
            <Card
              className="text-center p-2 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
            >
              <CardHeader>
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/50 dark:to-sky-900/50 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-sky-600 dark:text-sky-400 group-hover:animate-bounce" />
                </div>
                <CardTitle className="font-headline text-xl">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </motion.section>
);

const benefits = [
  "Saves 5–10 hours of planning per week",
  "Keeps learning consistent",
  "Makes every topic easy",
  "Works for exams, coding, schools, colleges",
  "Perfect for self-study"
];

const BenefitsSection = () => (
  <motion.section
    id="benefits"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={sectionVariants}
    className="py-20 md:py-28 bg-secondary/30"
  >
    <div className="container grid md:grid-cols-2 gap-12 items-center">
      <motion.div variants={itemVariants}>
        <h2 className="text-4xl font-extrabold font-headline">Why StudyForge?</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Focus on learning, not on logistics. We handle the planning so you can focus on what matters.
        </p>
        <ul className="mt-8 space-y-4">
          {benefits.map((benefit, index) => (
            <motion.li key={index} variants={itemVariants} className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
              <span className="text-lg text-foreground">{benefit}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
      <motion.div variants={itemVariants} className="relative h-96 w-full flex items-center justify-center overflow-hidden rounded-2xl">
         <Image
            src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Students collaborating"
            fill
            className="object-cover rounded-2xl shadow-lg"
            data-ai-hint="collaboration study"
         />
      </motion.div>
    </div>
  </motion.section>
);

const HowItWorksSection = () => (
  <motion.section
    id="how-it-works"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={sectionVariants}
    className="py-20 md:py-28"
  >
    <div className="container">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-extrabold font-headline">
          Three Steps to Success
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Getting started is simple. Tell us what you need, and our AI does the
          rest.
        </p>
      </div>
      <div className="relative grid md:grid-cols-3 gap-8">
        <div className="absolute top-8 left-0 w-full h-0.5 bg-border hidden md:block"></div>
        <motion.div
          variants={itemVariants}
          className="relative flex flex-col items-center text-center"
        >
          <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-background border-2 border-primary shadow-lg">
            <span className="text-2xl font-bold text-primary">1</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold font-headline">
            Tell us your goals
          </h3>
          <p className="mt-2 text-muted-foreground">
            Input your subjects, upcoming exams, assignments, and available
            study time.
          </p>
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="relative flex flex-col items-center text-center"
        >
          <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-background border-2 border-primary shadow-lg">
            <span className="text-2xl font-bold text-primary">2</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold font-headline">
            AI builds your engine
          </h3>
          <p className="mt-2 text-muted-foreground">
            Our AI analyzes your input to generate a personalized study plan and
            resources.
          </p>
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="relative flex flex-col items-center text-center"
        >
          <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-background border-2 border-primary shadow-lg">
            <span className="text-2xl font-bold text-primary">3</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold font-headline">
            Study with guidance
          </h3>
          <p className="mt-2 text-muted-foreground">
            Follow your daily plan, practice with AI flashcards, and track your
            progress.
          </p>
        </motion.div>
      </div>
    </div>
  </motion.section>
);

const PricingSection = () => (
  <motion.section
    id="pricing"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={sectionVariants}
    className="py-20 md:py-28"
  >
    <div className="container">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-4xl font-extrabold font-headline">
          Get Started for Free
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Our core features are free to use. Get your personal AI study partner
          today.
        </p>
      </div>
      <div className="flex justify-center">
        <motion.div variants={itemVariants}>
          <Card className="max-w-md w-full shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/5 border-2 border-primary">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-headline">Free Plan</CardTitle>
              <CardDescription>
                All the essentials to get you started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" /> AI Study
                  Planner
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Flashcard
                  Generator
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Essay Analyzer
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Basic
                  Analytics
                </li>
              </ul>
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
              >
                <Link href="/signup">Get Started - It's Free</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  </motion.section>
);

const Footer = () => (
  <motion.footer 
    className="py-8 border-t"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
    variants={sectionVariants}
  >
    <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Logo />
      </div>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="#" className="text-muted-foreground hover:text-foreground">
          About
        </Link>
        <Link href="#" className="text-muted-foreground hover:text-foreground">
          Privacy
        </Link>
        <Link href="#" className="text-muted-foreground hover:text-foreground">
          Contact
        </Link>
      </nav>
    </div>
  </motion.footer>
);

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TrustedSection />
        <FeatureShowcaseSection />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
