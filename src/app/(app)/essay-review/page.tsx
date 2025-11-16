
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Lightbulb,
  CheckCircle,
  BarChart,
  BookText,
  Bot,
  FileText,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  analyzeEssay,
  type AnalyzeEssayOutput,
} from "@/ai/flows/essay-feedback";
import { motion, AnimatePresence } from 'framer-motion';

const essaySchema = z.object({
  essayText: z.string().min(50, "Essay must be at least 50 characters long."),
});

type EssayFormValues = z.infer<typeof essaySchema>;

const ScoreCircle = ({ score, label }: { score: number; label: string }) => (
  <div className="relative h-20 w-20 sm:h-24 sm:w-24">
    <svg className="h-full w-full" viewBox="0 0 36 36">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(99 102 241)" />
          <stop offset="100%" stopColor="rgb(96 165 250)" />
        </linearGradient>
      </defs>
      <path
        className="text-secondary"
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.8305
          a 15.9155 15.9155 0 0 1 0 -31.8305"
        fill="none"
        strokeWidth="3"
      />
      <motion.path
        stroke="url(#gradient)"
        strokeDasharray="100 100"
        strokeDashoffset={100}
        animate={{ strokeDashoffset: 100 - score }}
        transition={{ duration: 1, ease: "easeOut" }}
        d="M18 2.0845
          a 15.9155 15.9155 0 0 1 0 31.8305
          a 15.9155 15.9155 0 0 1 0 -31.8305"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(90 18 18)"
      />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-xl sm:text-2xl font-bold">{score}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  </div>
);

export default function EssayReviewPage() {
  const [feedback, setFeedback] = useState<AnalyzeEssayOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EssayFormValues>({
    resolver: zodResolver(essaySchema),
    defaultValues: { essayText: "" },
  });

  async function onSubmit(data: EssayFormValues) {
    setIsLoading(true);
    setFeedback(null);
    setError(null);
    try {
      const result = await analyzeEssay({ text: data.essayText });
      setFeedback(result);
    } catch (error) {
      console.error("Error analyzing essay:", error);
      setError("Sorry, the AI failed to provide feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div 
      className="grid gap-6 md:grid-cols-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl">
              Essay Review
            </CardTitle>
            <CardDescription>
              Paste your essay below to get instant AI feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="essayText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Essay Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Start writing or paste your essay here..."
                          className="min-h-[300px] sm:min-h-[400px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Analyzing..." : "Get Feedback"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-6">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="flex items-center justify-center min-h-[400px] md:min-h-[500px]">
                <div className="text-center space-y-4">
                  <Bot className="h-12 w-12 mx-auto animate-bounce text-primary" />
                  <p className="font-semibold">AI is analyzing your essay...</p>
                  <Progress value={50} className="w-48 sm:w-64 animate-pulse" />
                </div>
              </Card>
            </motion.div>
          )}

          {error && (
             <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {feedback && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline text-xl md:text-2xl">
                    Feedback Report
                  </CardTitle>
                  <CardDescription>
                    Here's a breakdown of your essay's strengths and weaknesses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <motion.div 
                    className="flex justify-around items-center bg-secondary p-4 rounded-lg"
                    variants={itemVariants}
                  >
                    <ScoreCircle score={feedback.grammarScore} label="Grammar" />
                    <ScoreCircle
                      score={feedback.readabilityScore}
                      label="Readability"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <BarChart className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-headline">
                          Tone Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {feedback.toneAnalysis}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <Lightbulb className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-headline">
                          Clarity Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {feedback.claritySuggestions}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Card>
                      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                        <BookText className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-headline">
                          Structural Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {feedback.structuralSuggestions}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {feedback.correctedRewrite && (
                    <motion.div variants={itemVariants}>
                      <Card>
                        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <CardTitle className="text-lg font-headline">
                            Corrected Rewrite
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="prose prose-sm max-h-60 overflow-y-auto bg-secondary p-4 rounded-md mt-2">
                          <p>{feedback.correctedRewrite}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!isLoading && !feedback && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="flex items-center justify-center min-h-[400px] md:min-h-[500px]">
                <div className="text-center text-muted-foreground p-8">
                  <FileText className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg">
                    Your feedback will appear here.
                  </h3>
                  <p>Submit an essay to get started.</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
