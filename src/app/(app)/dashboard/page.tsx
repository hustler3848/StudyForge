
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Clock,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { generateMotivationNudge } from "@/ai/flows/ai-motivation-nudges";

const features = [
  {
    title: "Essay Review",
    description: "Get instant AI feedback on your writing.",
    href: "/essay-review",
    icon: BookOpen,
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
  },
  {
    title: "Flashcard Generator",
    description: "Create study decks from your notes automatically.",
    href: "/flashcards",
    icon: BrainCircuit,
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
  },
  {
    title: "Smart Study Plan",
    description: "Generate a personalized study schedule.",
    href: "/study-plan",
    icon: CalendarDays,
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/30",
  },
  {
    title: "Focus Mode",
    description: "Start a distraction-free study session.",
    href: "/focus-mode",
    icon: Clock,
    color: "text-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/30",
  },
];

function MotivationalQuote() {
  const [quote, setQuote] = useState("Loading your daily inspiration...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateMotivationNudge()
      .then((result) => setQuote(result.message))
      .catch(() => setQuote("The secret to getting ahead is getting started."))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="text-yellow-400" />
          <span>Stay Motivated</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-6 w-full animate-pulse rounded-md bg-muted-foreground/20" />
        ) : (
          <p className="text-muted-foreground italic">"{quote}"</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const upcomingTasks = user?.studyPlan?.dailySessions || [];

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
            <Card className="h-full flex flex-col transition-all duration-150 ease-in-out group-hover:shadow-lg hover:border-primary/50">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            {upcomingTasks.length > 0 ? (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingTasks.map((task, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{task.subject}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "px-2 py-1 text-xs font-semibold rounded-full",
                              {
                                "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300":
                                  task.priority.toLowerCase() === "high",
                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300":
                                  task.priority.toLowerCase() === "medium",
                                "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300":
                                  task.priority.toLowerCase() === "low",
                              }
                            )}
                          >
                            {task.priority}
                          </span>
                        </TableCell>
                        <TableCell>{task.estimatedTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            ) : (
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
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <MotivationalQuote />
          <Card>
             <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                Continue Studying
              </CardTitle>
            </CardHeader>
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
