"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    title: "Essay Review",
    description: "Get instant AI feedback on your writing.",
    href: "/essay-review",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "Flashcard Generator",
    description: "Create study decks from your notes automatically.",
    href: "/flashcards",
    icon: BrainCircuit,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    title: "Smart Study Plan",
    description: "Generate a personalized study schedule.",
    href: "/study-plan",
    icon: CalendarDays,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    title: "Focus Mode",
    description: "Start a distraction-free study session.",
    href: "/focus-mode",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="animate-in fade-in-50 space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {user?.displayName?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to have a productive day? Let's get started.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.title} className="block group">
            <Card className="h-full flex flex-col transition-all duration-150 ease-in-out group-hover:shadow-md">
              <CardHeader>
                <div
                  className={`p-3 rounded-full w-min ${feature.bgColor}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardTitle className="text-lg font-semibold">
                  {feature.title}
                </CardTitle>
                <CardDescription className="mt-1 text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            Upcoming Tasks
          </h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center text-muted-foreground p-4 sm:p-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No upcoming tasks</h3>
                <p className="text-sm sm:text-base">
                  Create a study plan to see your tasks here.
                </p>
                <Button variant="secondary" className="mt-4" asChild>
                  <Link href="/study-plan">Create Plan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-4">
            Continue Studying
          </h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center text-muted-foreground p-4 sm:p-8">
                <Clock className="h-12 w-12 mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No recent sessions</h3>
                <p className="text-sm sm:text-base">
                  Start a focus session to track your progress.
                </p>
                <Button variant="secondary" className="mt-4" asChild>
                  <Link href="/focus-mode">Start Focus Session</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
