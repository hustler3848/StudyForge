
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
  Trophy,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { generateMotivationNudge } from "@/ai/flows/ai-motivation-nudges";
import {
  calculateExamReadiness,
  type ExamReadinessInput,
} from "@/ai/flows/exam-readiness";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

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
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 h-full">
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

function StudyStreakCard({ streak }: { streak: number }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
          Study Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 flex flex-col justify-center items-center h-full">
        {streak > 0 ? (
          <div className="text-center">
            <Trophy className="h-16 w-16 mx-auto text-yellow-400 mb-2" />
            <p className="text-5xl font-bold">{streak}</p>
            <p className="text-muted-foreground">
              {streak > 1 ? "Day" : "Days"} Streak!
            </p>
            <p className="text-sm mt-2">Keep up the great work!</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-4 sm:p-8">
            <Clock className="h-12 w-12 mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No recent sessions</h3>
            <p className="text-sm sm:text-base">
              Start a focus session to track your progress and build a streak.
            </p>
            <Button variant="secondary" className="mt-4" asChild>
              <Link href="/focus-mode">Start Focus Session</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ScoreCircle = ({ score }: { score: number }) => (
  <div className="relative h-28 w-28 sm:h-32 sm:w-32 mx-auto">
    <svg className="h-full w-full" viewBox="0 0 36 36">
      <defs>
        <linearGradient id="readinessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(59 130 246)" />
          <stop offset="100%" stopColor="rgb(34 197 94)" />
        </linearGradient>
      </defs>
      <path
        className="text-secondary"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.8305 a 15.9155 15.9155 0 0 1 0 -31.8305"
        fill="none"
        strokeWidth="3"
      />
      <motion.path
        stroke="url(#readinessGradient)"
        strokeDasharray="100 100"
        strokeDashoffset={100}
        animate={{ strokeDashoffset: 100 - score }}
        transition={{ duration: 1, ease: "easeOut" }}
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.8305 a 15.9155 15.9155 0 0 1 0 -31.8305"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(90 18 18)"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-4xl font-bold">{score}%</span>
      <span className="text-xs text-muted-foreground">Ready</span>
    </div>
  </div>
);

function ExamReadinessCard() {
  const [score, setScore] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for the readiness calculation
    const mockInput: ExamReadinessInput = {
      hoursStudied: 15,
      topicDifficulty: "medium",
      consistency: "5 of 7 days",
      quizzesSolved: 3,
      deadlineProximity: "in 1 week",
    };

    calculateExamReadiness(mockInput)
      .then((result) => {
        setScore(result.readinessScore);
        setTip(result.coachingTip);
      })
      .catch((err) => {
        console.error("Readiness score error:", err);
        setScore(78); // Fallback score
        setTip("Stay consistent with your study plan for best results.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
          Exam Readiness
        </CardTitle>
        <CardDescription>Your AI-calculated preparedness score.</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 w-32 rounded-full bg-muted mx-auto animate-pulse" />
            <div className="h-4 w-3/4 mx-auto rounded-md bg-muted animate-pulse" />
          </div>
        ) : score !== null && (
          <div className="space-y-4">
            <ScoreCircle score={score} />
            <div className="mt-4">
              <h3 className="font-semibold flex items-center justify-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                Coaching Tip
              </h3>
              <p className="text-muted-foreground text-sm italic">"{tip}"</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { user } = useAuth();
  const upcomingTasks = user?.studyPlan?.dailySessions || [];
  const studyStreak = user?.studyStreak || 0;

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-blue-400 text-transparent bg-clip-text">
          Welcome back, {user?.displayName || "Student"}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to have a productive day? Let's get started.
        </p>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        {features.map((feature) => (
          <motion.div key={feature.title} variants={itemVariants}>
            <Link href={feature.href} className="block group h-full">
              <Card className="h-full flex flex-col transition-all duration-150 ease-in-out group-hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div
                    className={cn(
                      `p-3 rounded-full w-min ${feature.bgColor}`
                    )}
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
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid gap-6 lg:grid-cols-3"
        variants={containerVariants}
      >
        <motion.div className="lg:col-span-2" variants={itemVariants}>
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
        </motion.div>

        <motion.div className="space-y-6" variants={itemVariants}>
          <MotivationalQuote />
          <StudyStreakCard streak={studyStreak} />
        </motion.div>
      </motion.div>
       <motion.div
        className="grid gap-6 md:grid-cols-2"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
            <ExamReadinessCard />
        </motion.div>
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center text-muted-foreground h-48">
                    <p>More smart widgets are on the way!</p>
                </CardContent>
            </Card>
        </motion.div>
       </motion.div>
    </motion.div>
  );
}
