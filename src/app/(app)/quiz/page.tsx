'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import {
  generateQuiz,
  type GenerateQuizOutput,
} from '@/ai/flows/quiz-generation';
import { Bot, Loader2, PartyPopper, RotateCw, ThumbsUp, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


const quizTopicSchema = z.object({
  topic: z.string().min(3, 'Please enter a topic.'),
});

type QuizTopicFormValues = z.infer<typeof quizTopicSchema>;
type Question = GenerateQuizOutput['questions'][0];

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

export default function QuizPage() {
  const [quiz, setQuiz] = useState<GenerateQuizOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const form = useForm<QuizTopicFormValues>({
    resolver: zodResolver(quizTopicSchema),
    defaultValues: { topic: '' },
  });

  async function onSubmit(data: QuizTopicFormValues) {
    setIsLoading(true);
    setError(null);
    setQuiz(null);
    try {
      const result = await generateQuiz({ topic: data.topic });
      setQuiz(result);
      // Reset quiz state
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
    <motion.div 
        className="max-w-xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl">AI Quick Quiz</CardTitle>
            <CardDescription>
              Enter any topic and our AI will generate a 5-question quiz to test your knowledge.
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
      </motion.div>
    </motion.div>
  );
}
