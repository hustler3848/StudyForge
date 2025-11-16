
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const NUDGE_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

const motivationalNudges = [
  "Believe you can and you're halfway there.",
  "The secret to getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future depends on what you do today.",
  "You are capable of more than you know.",
  "Every expert was once a beginner. Keep learning.",
  "Push yourself, because no one else is going to do it for you.",
  "A little progress each day adds up to big results.",
  "Stay positive, work hard, make it happen.",
  "Success isn't overnight. It's when every day you get a little better than the day before."
];


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
  
  const showMotivationNudge = () => {
    const randomIndex = Math.floor(Math.random() * motivationalNudges.length);
    const message = motivationalNudges[randomIndex];
    toast({
      title: "Keep Going! 💪",
      description: message,
    });
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
    <div className="flex justify-center items-center h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {isComplete ? (
                  <motion.div 
                    key="complete"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                      <Trophy className="h-24 w-24 mx-auto text-yellow-400" />
                      <h2 className="text-3xl font-bold font-headline">Session Complete!</h2>
                      <p className="text-muted-foreground">Great work! You've completed a full focus session.</p>
                      <Button onClick={resetTimer} className="w-full">
                          <RotateCw className="mr-2 h-4 w-4" /> Start New Session
                      </Button>
                  </motion.div>
              ) : (
                  <motion.div 
                    key="timer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
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
                  </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
