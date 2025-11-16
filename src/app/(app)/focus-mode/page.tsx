"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateMotivationNudge } from '@/ai/flows/ai-motivation-nudges';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const NUDGE_INTERVAL = 10 * 60 * 1000; // 10 minutes in ms

export default function FocusModePage() {
  const [time, setTime] = useState(FOCUS_DURATION);
  const [isActive, setIsActive] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isActive && time > 0) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0 && isActive) {
      setIsActive(false);
      setIsComplete(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
      // In a real app, save this session to Firestore
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, time]);
  
  const showMotivationNudge = async () => {
    try {
      const { message } = await generateMotivationNudge();
      toast({
        title: "Keep Going! 💪",
        description: message,
      });
    } catch (error) {
      console.error("Failed to get motivation nudge:", error);
      toast({
        title: "Keep Going! 💪",
        description: "You're doing great! Stay focused.",
      });
    }
  };

  const toggleTimer = () => {
    if(isComplete) return;
    setIsActive(!isActive);
    if (!isActive) {
        // Starting timer
        showMotivationNudge(); // show one at the start
        nudgeTimerRef.current = setInterval(showMotivationNudge, NUDGE_INTERVAL);
    } else {
        // Pausing timer
        if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    setIsActive(false);
    setIsComplete(false);
    setTime(FOCUS_DURATION);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-center items-center h-[70vh] animate-in fade-in-50">
      <Card className="w-full max-w-md shadow-2xl text-center">
        <CardContent className="p-8">
            {isComplete ? (
                <div className="space-y-6">
                    <Trophy className="h-24 w-24 mx-auto text-yellow-400" />
                    <h2 className="text-3xl font-bold font-headline">Session Complete!</h2>
                    <p className="text-muted-foreground">Great work! You've completed a full focus session.</p>
                    <Button onClick={resetTimer} className="w-full">
                        <RotateCw className="mr-2 h-4 w-4" /> Start New Session
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    <h2 className="text-2xl font-semibold text-muted-foreground">Focus Mode</h2>
                    <div className="font-mono text-8xl font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatTime(time)}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={toggleTimer} size="lg" className="w-36">
                            {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                            {isActive ? 'Pause' : 'Start'}
                        </Button>
                        <Button onClick={resetTimer} variant="secondary" size="lg">
                            <RotateCw className="mr-2" /> Reset
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
