"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Bot, BookOpen, Sparkles, BrainCircuit } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

import { generateFlashcards, type GenerateFlashcardsOutput } from '@/ai/flows/flashcard-generation';

const flashcardSchema = z.object({
  notes: z.string().min(100, 'Please provide at least 100 characters of notes to generate flashcards.'),
});

type FlashcardFormValues = z.infer<typeof flashcardSchema>;

export default function FlashcardsPage() {
  const [generatedDeck, setGeneratedDeck] = useState<GenerateFlashcardsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: { notes: '' },
  });

  async function onSubmit(data: FlashcardFormValues) {
    setIsLoading(true);
    setGeneratedDeck(null);
    try {
      const result = await generateFlashcards({ text: data.notes });
      setGeneratedDeck(result);
      // In a real app, we would save this deck to Firestore and get a deckId
      // For now, we'll store it in localStorage to pass to the practice page
      localStorage.setItem('temp-deck', JSON.stringify(result.flashcards));
    } catch (error) {
      console.error('Error generating flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const startPractice = () => {
    // In a real app, this would route to /flashcards/{deckId}
    router.push('/flashcards/practice');
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 animate-in fade-in-50">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Flashcard Generator</CardTitle>
          <CardDescription>Paste your notes, and our AI will create a study deck for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Your Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your class notes, textbook chapter, or any text here..."
                        className="min-h-[400px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Generating Deck...' : 'Create Flashcards'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {isLoading && (
            <Card className="flex items-center justify-center min-h-[500px]">
                <div className="text-center space-y-4">
                <BrainCircuit className="h-12 w-12 mx-auto animate-pulse text-primary" />
                <p className="font-semibold">AI is extracting key concepts...</p>
                <Progress value={50} className="w-64 animate-pulse" />
                </div>
            </Card>
        )}

        {generatedDeck && (
            <Card className="shadow-lg animate-in fade-in-50">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-green-100 p-3 rounded-full">
                    <Sparkles className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="font-headline text-2xl mt-4">Deck Created!</CardTitle>
                  <CardDescription>
                    We found <span className="font-bold text-primary">{generatedDeck.flashcards.length}</span> key concepts in your notes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="space-y-2">
                      <p className="font-semibold">Your new deck includes:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                          <li>Q/A Pairs</li>
                          <li>Key Definitions</li>
                          <li>Core Concepts</li>
                          <li>Mnemonics</li>
                      </ul>
                  </div>
                  <Button size="lg" className="w-full" onClick={startPractice}>
                    Start Practicing
                  </Button>
                </CardContent>
            </Card>
        )}
        
        {!isLoading && !generatedDeck && (
            <Card className="flex items-center justify-center min-h-[500px]">
                <div className="text-center text-muted-foreground p-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">Your new flashcard deck will appear here.</h3>
                    <p>Paste your notes to get started.</p>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
