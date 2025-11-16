
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Flashcard as FlashcardComponent } from '@/components/flashcard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, RotateCw, X } from 'lucide-react';
import { type Flashcard } from '@/lib/types';

// Mock flashcards if not found in localStorage
const mockFlashcards: Flashcard[] = [
    { question: 'What is the powerhouse of the cell?', answer: 'The Mitochondria', type: 'Q/A' },
    { question: 'Define Photosynthesis.', answer: 'The process by which green plants use sunlight to synthesize foods from carbon dioxide and water.', type: 'Definition' },
    { question: 'What is the capital of France?', answer: 'Paris', type: 'Q/A' },
    { question: 'Explain the concept of supply and demand.', answer: 'A model for price determination in a market. It postulates that, holding all else equal, in a competitive market, the unit price for a particular good will vary until it settles at a point where the quantity demanded by consumers will equal the quantity supplied by producers.', type: 'Concept' },
];

export default function FlashcardPracticePage() {
  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewAgain, setReviewAgain] = useState<number[]>([]);
  const [mastered, setMastered] = useState<number[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const storedDeck = localStorage.getItem('temp-deck');
    const parsedDeck = storedDeck ? JSON.parse(storedDeck) : mockFlashcards;
    if (parsedDeck && parsedDeck.length > 0) {
        // Shuffle the deck for a better learning experience
        setDeck(parsedDeck.sort(() => Math.random() - 0.5));
    }
    setIsLoading(false);
  }, []);

  const currentCard = useMemo(() => deck[currentIndex], [deck, currentIndex]);
  
  const progress = useMemo(() => {
    if (deck.length === 0) return 0;
    return ((mastered.length + reviewAgain.length) / deck.length) * 100;
  }, [mastered, reviewAgain, deck.length]);

  const handleNextCard = (knewIt: boolean) => {
    setIsFlipped(false);

    if (knewIt) {
        setMastered(prev => [...prev, currentIndex]);
    } else {
        setReviewAgain(prev => [...prev, currentIndex]);
    }

    if (currentIndex + 1 >= deck.length) {
        if(reviewAgain.length > 0) {
            // Start reviewing the cards marked for review
            const reviewDeck = reviewAgain.map(i => deck[i]);
            setDeck(reviewDeck);
            setCurrentIndex(0);
            setReviewAgain([]);
            setMastered([]); // Reset for the review round
        } else {
            setIsSessionComplete(true);
        }
    } else {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200); // delay for flip animation
    }
  };
  
  const resetSession = () => {
    setIsLoading(true);
    const storedDeck = localStorage.getItem('temp-deck');
    const parsedDeck = storedDeck ? JSON.parse(storedDeck) : mockFlashcards;
    setDeck(parsedDeck.sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviewAgain([]);
    setMastered([]);
    setIsSessionComplete(false);
    setIsLoading(false);
  }

  if (isLoading || deck.length === 0) {
    return <div className="text-center p-10 animate-in fade-in-50">Loading deck...</div>;
  }

  if (isSessionComplete) {
    return (
        <Card className="max-w-2xl mx-auto text-center animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="text-3xl font-headline">Congratulations!</CardTitle>
                <CardDescription>You've completed this study session.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-lg">You've mastered all the cards in this deck.</p>
                <p className="text-muted-foreground mt-2">Keep up the great work!</p>
            </CardContent>
            <CardFooter>
                <Button onClick={resetSession} className="w-full">
                    <RotateCw className="mr-2 h-4 w-4" /> Start Over
                </Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 animate-in fade-in-50">
        <div>
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-muted-foreground">Card {currentIndex + 1} of {deck.length}</p>
                <p className="text-sm font-semibold">{Math.round(progress)}% Complete</p>
            </div>
            <Progress value={progress} />
        </div>
      
      <div className="aspect-[3/2]">
        <FlashcardComponent
            front={currentCard.question}
            back={currentCard.answer}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
            variant="outline"
            className="h-20 text-red-500 border-red-500/50 hover:bg-red-500/10 hover:text-red-600"
            onClick={() => handleNextCard(false)}
            disabled={!isFlipped}
        >
            <X className="mr-2 h-6 w-6" /> <span className="text-lg">Review Again</span>
        </Button>
        <Button
            variant="outline"
            className="h-20 text-green-500 border-green-500/50 hover:bg-green-500/10 hover:text-green-600"
            onClick={() => handleNextCard(true)}
            disabled={!isFlipped}
        >
            <Check className="mr-2 h-6 w-6" /> <span className="text-lg">I Got This</span>
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {isFlipped ? "Choose how well you knew the answer." : "Click the card to reveal the answer."}
      </p>
    </div>
  );
}

    