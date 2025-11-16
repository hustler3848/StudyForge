
"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Bot, Calendar, Plus, Trash2, GripVertical } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  generateStudyPlan,
  type GenerateStudyPlanOutput,
} from "@/ai/flows/smart-study-plan";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StudyPlan } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";

const studyPlanSchema = z.object({
  tasks: z
    .array(z.object({ value: z.string().min(1, "Task cannot be empty.") }))
    .min(1, "Please add at least one task."),
  freeHours: z
    .array(
      z.object({ value: z.string().min(1, "Time slot cannot be empty.") })
    )
    .min(1, "Please add at least one free time slot."),
  studyGoals: z.string().min(10, "Please describe your study goals."),
});

type StudyPlanFormValues = z.infer<typeof studyPlanSchema>;

const subjectColors: { [key: string]: string } = {
  default: "bg-gray-500 text-gray-50",
  math: "bg-blue-500 text-blue-50",
  science: "bg-green-500 text-green-50",
  history: "bg-yellow-500 text-yellow-50",
  english: "bg-purple-500 text-purple-50",
  biology: "bg-emerald-500 text-emerald-50",
  chemistry: "bg-indigo-500 text-indigo-50",
  physics: "bg-sky-500 text-sky-50",
  literature: "bg-pink-500 text-pink-50",
  algebra: "bg-cyan-500 text-cyan-50",
};

const getColorForSubject = (subject: string) => {
  const lowerCaseSubject = subject.toLowerCase();
  for (const key in subjectColors) {
    if (lowerCaseSubject.includes(key)) {
      return subjectColors[key];
    }
  }
  return subjectColors.default;
};

type StudyBlock = {
  id: string;
  subject: string;
  time: string; // e.g., "09:00"
  duration: number; // in hours
};

const DraggableSubject = ({ subject }: { subject: string }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `subject-${subject}`,
    data: { subject },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-2 rounded-md flex items-center gap-2 cursor-grab touch-none",
        getColorForSubject(subject)
      )}
    >
      <GripVertical className="h-5 w-5" />
      {subject}
    </div>
  );
};

const DroppableHour = ({
  time,
  children,
}: {
  time: string;
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `hour-${time}`,
    data: { time },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "h-16 border-b relative",
        isOver && "bg-primary/20"
      )}
    >
      <span className="absolute top-1 left-1 text-xs text-muted-foreground">
        {time}
      </span>
      {children}
    </div>
  );
};

const hours = Array.from({ length: 18 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);

export default function StudyPlanPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studyBlocks, setStudyBlocks] = useState<StudyBlock[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const subjects = user?.profile?.subjects || [];

  const form = useForm<StudyPlanFormValues>({
    resolver: zodResolver(studyPlanSchema),
    defaultValues: {
      tasks: [{ value: "" }],
      freeHours: [{ value: "" }],
      studyGoals: "",
    },
  });

  const { fields: taskFields, append: appendTask, remove: removeTask } = useFieldArray({ control: form.control, name: "tasks" });
  const { fields: freeHourFields, append: appendFreeHour, remove: removeFreeHour } = useFieldArray({ control: form.control, name: "freeHours" });

  async function onSubmit(data: StudyPlanFormValues) {
    if (!user || !user.profile) return;
    setIsLoading(true);
    setError(null);
    setStudyBlocks([]);

    const input = {
      profile: {
        gradeLevel: user.profile.gradeLevel,
        subjects: user.profile.subjects,
        weeklyFreeHours: user.profile.weeklyFreeHours,
      },
      tasks: data.tasks.map((t) => t.value),
      freeHours: data.freeHours.map((f) => f.value),
      studyGoals: data.studyGoals,
    };

    try {
      const result = await generateStudyPlan(input);
      const newBlocks: StudyBlock[] = result.dailySessions.map(
        (session, index) => ({
          id: `ai-block-${index}`,
          subject: session.subject,
          time: "09:00", // Default time, AI doesn't provide this yet
          duration: 1,
        })
      );
      // For now, we are not placing AI suggestions on calendar.
      // This could be a future improvement.
      // setStudyBlocks(newBlocks);
      alert("AI plan generated! You can now drag subjects to the calendar.");
    } catch (error) {
      console.error("Error generating study plan:", error);
      setError("Sorry, the AI failed to generate a study plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    setActiveId(null);
    if (over && active.data.current?.subject) {
      const subject = active.data.current.subject;
      const time = over.data.current?.time;
      
      const newBlock: StudyBlock = {
        id: `${subject}-${time}-${Date.now()}`,
        subject,
        time,
        duration: 1,
      };

      // Avoid duplicates for the same hour
      setStudyBlocks((blocks) => {
        const existingBlock = blocks.find(b => b.time === time);
        if (existingBlock) return blocks;
        return [...blocks, newBlock];
      });
    }
  }
  
  const activeSubject = activeId?.startsWith("subject-") 
    ? activeId.replace("subject-", "")
    : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl md:text-2xl">
                Create Your Study Plan
              </CardTitle>
              <CardDescription>
                Drag subjects to the timeline or use the AI generator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormLabel>Subjects</FormLabel>
                <div className="p-4 bg-secondary/50 rounded-lg space-y-2">
                    {subjects.length > 0 ? (
                        subjects.map(subject => (
                            <DraggableSubject key={subject} subject={subject} />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">Add subjects in your profile to start planning.</p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-lg">
                Or Use The AI Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <FormLabel className="text-sm font-medium">Upcoming Tests & Assignments</FormLabel>
                    <div className="space-y-2 mt-2">
                      {taskFields.map((field, index) => (
                        <FormField key={field.id} control={form.control} name={`tasks.${index}.value`} render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Input placeholder={`e.g., Math test on Friday`} {...field} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)} disabled={taskFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendTask({ value: "" })}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
                    <FormMessage className="mt-1">{form.formState.errors.tasks?.message}</FormMessage>
                  </div>
                  <div>
                    <FormLabel className="text-sm font-medium">Free Time Slots</FormLabel>
                    <div className="space-y-2 mt-2">
                      {freeHourFields.map((field, index) => (
                        <FormField key={field.id} control={form.control} name={`freeHours.${index}.value`} render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Input placeholder={`e.g., Monday 4-6 PM`} {...field} /></FormControl>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFreeHour(index)} disabled={freeHourFields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendFreeHour({ value: "" })}><Plus className="mr-2 h-4 w-4" /> Add Slot</Button>
                    <FormMessage className="mt-1">{form.formState.errors.freeHours?.message}</FormMessage>
                  </div>
                  <FormField control={form.control} name="studyGoals" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Study Goals</FormLabel>
                      <FormControl><Textarea placeholder="e.g., Ace my history midterm, improve my essay writing skills..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Generating..." : "Get AI Suggestions"}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-xl md:text-2xl">Today's Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[calc(18*4rem)] overflow-y-auto pr-2">
                {hours.map((hour) => (
                  <DroppableHour key={hour} time={hour}>
                      {studyBlocks
                        .filter((block) => block.time === hour)
                        .map((block) => (
                           <motion.div
                            key={block.id}
                            layoutId={block.id}
                            className={cn("absolute inset-x-0 mx-10 top-0 bottom-0 p-2 rounded-lg text-sm flex items-center z-10", getColorForSubject(block.subject))}
                            style={{ height: `${block.duration * 4 - 0.25}rem` }}
                           >
                            {block.subject}
                            <button onClick={() => setStudyBlocks(bs => bs.filter(b => b.id !== block.id))} className="ml-auto p-1 rounded-full hover:bg-white/20">
                                <Trash2 className="h-4 w-4" />
                            </button>
                           </motion.div>
                        ))}
                  </DroppableHour>
                ))}
              </div>
            </CardContent>
          </Card>
           {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>
      </div>
      <DragOverlay>
        {activeSubject ? (
          <div className={cn("p-2 rounded-md flex items-center gap-2", getColorForSubject(activeSubject))}>
             <GripVertical className="h-5 w-5" />
             {activeSubject}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
