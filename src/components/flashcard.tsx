"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2 } from 'lucide-react';

interface FlashcardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ front, back, isFlipped, onFlip }: FlashcardProps) {
    const handleTextToSpeech = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        const utterance = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(utterance);
    }
    
    const getCardText = (node: React.ReactNode): string => {
        if (typeof node === 'string') return node;
        if (typeof node === 'number') return String(node);
        if (Array.isArray(node)) return node.map(getCardText).join(' ');
        if (typeof node === 'object' && node !== null && 'props' in node) {
            return getCardText(node.props.children);
        }
        return '';
    };

  return (
    <div
      className="w-full h-full [perspective:1000px] cursor-pointer"
      onClick={onFlip}
    >
      <div
        className={cn(
          "relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700",
          { "[transform:rotateY(180deg)]": isFlipped }
        )}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center p-6 shadow-2xl">
          <CardContent className="text-center">
            <div className="text-2xl md:text-3xl font-bold">{front}</div>
          </CardContent>
          <button onClick={(e) => handleTextToSpeech(e, getCardText(front))} className="absolute bottom-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <Volume2 />
          </button>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center p-6 shadow-2xl">
          <CardContent className="text-center">
            <div className="text-xl md:text-2xl">{back}</div>
          </CardContent>
          <button onClick={(e) => handleTextToSpeech(e, getCardText(back))} className="absolute bottom-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <Volume2 />
          </button>
        </Card>
      </div>
    </div>
  );
}
