'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  FileText,
  Flame,
  Sparkles,
  Target,
  Timer,
  BarChart3,
  ListTodo
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const features = [
  {
    title: 'Start Essay Review',
    description: 'Get AI-powered feedback on your writing.',
    href: '/essay-review',
    icon: FileText,
    cta: 'Review Essay',
  },
  {
    title: 'Generate Study Plan',
    description: 'Create a personalized study schedule in seconds.',
    href: '/study-plan',
    icon: Target,
    cta: 'Create Plan',
  },
  {
    title: 'Create Flashcards',
    description: 'Turn your notes into interactive flashcards.',
    href: '/flashcards',
    icon: BookOpen,
    cta: 'Generate Deck',
  },
  {
    title: 'Start Focus Mode',
    description: 'Eliminate distractions and get in the zone.',
    href: '/focus-mode',
    icon: Timer,
    cta: 'Begin Focus',
  },
];

const stats = [
  {
    title: 'Study Time Today',
    value: '1h 25m',
    icon: BarChart3,
    color: 'text-primary',
  },
  { title: 'Tasks Due Today', value: '3', icon: ListTodo, color: 'text-orange-500' },
  { title: 'Study Streak', value: '7 days', icon: Flame, color: 'text-red-500' },
  {
    title: 'Flashcards Mastered',
    value: '42',
    icon: Sparkles,
    color: 'text-yellow-500',
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-in fade-in-50">
      <div className="space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Welcome back!
            </h1>
            <p className="text-lg text-muted-foreground">
              Here's your personalized dashboard to supercharge your studies.
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.title === 'Study Time Today' && (
                   <div className="mt-2">
                     <p className="text-xs text-muted-foreground">Daily goal: 2h</p>
                     <Progress value={(85/120)*100} className="h-2 mt-1" />
                   </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 pt-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={feature.href} passHref>
                  <Button className="w-full">
                    {feature.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
