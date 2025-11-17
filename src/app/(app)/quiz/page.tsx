'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  generateQuiz,
  type GenerateQuizOutput,
} from '@/ai/flows/quiz-generation';
import { Bot, Loader2, PartyPopper, RotateCw, ThumbsUp, XCircle, TableIcon, CalendarDays, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


const quizOptionsSchema = z.object({
  topic: z.string().min(3, 'Please enter a topic.'),
  numberOfQuestions: z.coerce.number().min(3, 'Minimum 3 questions.').max(10, 'Maximum 10 questions.'),
  difficulty: z.enum(['Any', 'Easy', 'Medium', 'Hard']),
  questionType: z.enum(['Any', 'Theoretical', 'Numerical']),
});

type QuizOptionsFormValues = z.infer<typeof quizOptionsSchema>;
type Question = GenerateQuizOutput['questions'][0];
type QuizResult = {
    id: string;
    topic: string;
    score: number;
    totalQuestions: number;
    createdAt: { seconds: number, nanoseconds: number } | Date;
}


export default function QuizPage() {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [pastQuizzes, setPastQuizzes] = useState<QuizResult[]>([]);

  const form = useForm<QuizOptionsFormValues>({
    resolver: zodResolver(quizOptionsSchema),
    defaultValues: {
      topic: '',
      numberOfQuestions: 5,
      difficulty: 'Any',
      questionType: 'Any',
    },
  });

  // Fetch past quizzes
  useEffect(() => {
    if (!user) return;
    const quizzesCollectionRef = collection(firestore, `users/${user.uid}/quizzes`);
    const q = query(quizzesCollectionRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult));
        setPastQuizzes(quizzes);
    },
    (error) => {
        const permissionError = new FirestorePermissionError({
            path: quizzesCollectionRef.path,
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Error fetching quizzes:", error);
    });

    return () => unsubscribe();
  }, [user]);

  async function onSubmit(data: QuizOptionsFormValues) {
    setIsLoading(true);
    setError(null);
    setQuiz(null);
    try {
      const result = await generateQuiz(data);
      setQuiz(result);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setScore(0);
    } catch (e) {
      console.error(e);
      setError('The AI failed to generate a quiz for this topic. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleAnswerSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);
    if (index === quiz?.questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    const isLastQuestion = currentQuestionIndex === (quiz?.questions.length ?? 0) - 1;
    if (isLastQuestion) {
        // Save the quiz result to Firestore
        if (user && quiz) {
            const quizData = {
                topic: form.getValues('topic'),
                score,
                totalQuestions: quiz.questions.length,
                questions: quiz.questions, // save the actual questions
                createdAt: new Date(),
            };
            const quizzesCollectionRef = collection(firestore, `users/${user.uid}/quizzes`);
            addDoc(quizzesCollectionRef, quizData)
            .catch(serverError => {
                const permissionError = new FirestorePermissionError({
                  path: quizzesCollectionRef.path,
                  operation: 'create',
                  requestResourceData: quizData,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
        }
    }
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
  }

  const resetQuiz = () => {
    setQuiz(null);
    form.reset();
  }

  const isQuizComplete = quiz && currentQuestionIndex >= quiz.questions.length;

  const getOptionStyling = (index: number, currentQuestion: Question) => {
    if (!isAnswered) return 'border-border bg-background hover:bg-accent';

    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const isSelected = index === selectedAnswer;

    if (isCorrect) return 'border-green-500 bg-green-100/80 dark:bg-green-900/50 text-foreground';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-100/80 dark:bg-red-900/50 text-foreground';
    
    return 'border-border bg-muted/50 text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center space-y-4">
            <Bot className="h-16 w-16 mx-auto animate-pulse text-primary" />
            <p className="text-muted-foreground">Our AI is crafting your quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
          <XCircle className="h-4 w-4"/>
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  if (isQuizComplete) {
    return (
        <motion.div initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}>
            <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                    <PartyPopper className="h-16 w-16 mx-auto text-yellow-400" />
                    <CardTitle className="font-headline text-3xl mt-4">Quiz Complete!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">You scored</p>
                    <p className="text-6xl font-bold my-2">{score} / {quiz.questions.length}</p>
                    <p className="text-muted-foreground">Great job on testing your knowledge!</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={resetQuiz} className="w-full">
                        <RotateCw className="mr-2 h-4 w-4" /> Try a New Topic
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    )
  }

  if (quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    return (
        <motion.div key={currentQuestionIndex} initial={{opacity: 0, x: 50}} animate={{opacity: 1, x: 0}} className="max-w-3xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline text-xl md:text-2xl">Question {currentQuestionIndex + 1}/{quiz.questions.length}</CardTitle>
                        <Badge 
                           className={cn({
                            'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': currentQuestion.difficulty === 'Easy',
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': currentQuestion.difficulty === 'Medium',
                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': currentQuestion.difficulty === 'Hard',
                           })}
                        >{currentQuestion.difficulty}</Badge>
                    </div>
                    <CardDescription className="text-lg pt-4">{currentQuestion.questionText}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {currentQuestion.options.map((option, index) => (
                       <Button 
                         key={index}
                         variant="outline" 
                         className={cn("w-full h-auto min-h-12 py-3 justify-start text-left whitespace-normal", getOptionStyling(index, currentQuestion))}
                         onClick={() => handleAnswerSelect(index)}
                       >
                         <span className="mr-4 font-bold">{String.fromCharCode(65 + index)}</span>
                         <span>{option}</span>
                       </Button>
                   ))}
                </CardContent>
                <CardFooter className="flex flex-col items-start">
                    <AnimatePresence>
                    {isAnswered && (
                        <motion.div 
                            initial={{opacity: 0, height: 0}} 
                            animate={{opacity: 1, height: 'auto'}} 
                            exit={{opacity: 0, height: 0}}
                            className="w-full space-y-4"
                        >
                            <Alert variant={selectedAnswer === currentQuestion.correctAnswerIndex ? 'default' : 'destructive'} className={selectedAnswer === currentQuestion.correctAnswerIndex ? "border-green-500/50" : ""}>
                                <ThumbsUp className="h-4 w-4" />
                                <AlertTitle>{selectedAnswer === currentQuestion.correctAnswerIndex ? "Correct!" : "Not Quite"}</AlertTitle>
                                <AlertDescription>{currentQuestion.explanation}</AlertDescription>
                            </Alert>
                             <Button onClick={handleNextQuestion} className="w-full">
                                {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                            </Button>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </CardFooter>
            </Card>
        </motion.div>
    )
  }

  return (
    <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl">AI Quick Quiz</CardTitle>
            <CardDescription>
              Enter any topic and our AI will generate a quiz to test your knowledge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 'The Italian Renaissance' or 'Calculus Derivatives'"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="numberOfQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel># of Questions</FormLabel>
                           <FormControl>
                            <Input type="number" min="3" max="10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Any">Any</SelectItem>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="questionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Any">Any</SelectItem>
                                    <SelectItem value="Theoretical">Theoretical</SelectItem>
                                    <SelectItem value="Numerical">Numerical</SelectItem>
                                </SelectContent>
                            </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Quiz...</>
                  ) : (
                    'Start Quiz'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {pastQuizzes.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-xl md:text-2xl">Quiz History</CardTitle>
                    <CardDescription>Review your past quiz performances.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Topic</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pastQuizzes.map(q => (
                                <TableRow key={q.id}>
                                    <TableCell className="font-medium">{q.topic}</TableCell>
                                    <TableCell>{q.score} / {q.totalQuestions}</TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                        {format(q.createdAt instanceof Date ? q.createdAt : new Date(q.createdAt.seconds * 1000), 'MMM d, yyyy')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
