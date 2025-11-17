
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCw, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

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

const ProgressRing = ({ progress }: { progress: number }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative h-52 w-52 sm:h-64 sm:w-64">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
                 <circle
                    className="text-secondary"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    r={radius}
                    cx="100"
                    cy="100"
                />
                <motion.circle
                    className="text-primary"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="100"
                    cy="100"
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                    transition={{ duration: 0.5, ease: "linear" }}
                />
            </svg>
        </div>
    );
};


export default function FocusModePage() {
  const [duration, setDuration] = useState(25 * 60);
  const [time, setTime] = useState(duration);
  const [isActive, setIsActive] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('25');
  const [inputSeconds, setInputSeconds] = useState('00');

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
  
  const handleStartSession = () => {
    const minutes = parseInt(inputMinutes, 10) || 0;
    const seconds = parseInt(inputSeconds, 10) || 0;
    const totalSeconds = (minutes * 60) + seconds;

    if (totalSeconds <= 0) return;

    setDuration(totalSeconds);
    setTime(totalSeconds);
    setSessionStarted(true);
    setIsActive(true);
    showMotivationNudge();
    nudgeTimerRef.current = setInterval(showMotivationNudge, NUDGE_INTERVAL);
  }

  const toggleTimer = () => {
    if(isComplete) return;
    setIsActive(!isActive);
    if (!isActive) {
        nudgeTimerRef.current = setInterval(showMotivationNudge, NUDGE_INTERVAL);
    } else {
        if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (nudgeTimerRef.current) clearInterval(nudgeTimerRef.current);
    setIsActive(false);
    setIsComplete(false);
    setSessionStarted(false);
    const newDuration = (parseInt(inputMinutes, 10) || 0) * 60 + (parseInt(inputSeconds, 10) || 0);
    setDuration(newDuration);
    setTime(newDuration);
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (time / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
        <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline">Focus Session</h1>
        </div>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
        <Card className="w-full max-w-md text-center shadow-2xl mx-auto">
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
              ) : sessionStarted ? (
                  <motion.div 
                    key="timer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 flex flex-col items-center"
                  >
                      <h2 className="text-2xl font-semibold text-muted-foreground">Time Remaining</h2>
                      <div className="relative flex items-center justify-center">
                        <ProgressRing progress={progress} />
                        <div className="absolute font-mono text-5xl sm:text-6xl font-bold text-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatTime(time)}
                        </div>
                      </div>
                      <div className="flex gap-4 justify-center">
                          <Button onClick={toggleTimer} size="lg" className="w-36">
                              {isActive ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                              {isActive ? 'Pause' : 'Resume'}
                          </Button>
                          <Button onClick={resetTimer} variant="secondary" size="lg">
                              <RotateCw className="mr-2" /> Reset
                          </Button>
                      </div>
                  </motion.div>
              ) : (
                 <motion.div 
                    key="setup"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 flex flex-col items-center"
                 >
                    <h2 className="text-2xl font-semibold text-muted-foreground">Set Timer</h2>
                     <div className="flex items-center justify-center gap-2">
                        <Input
                            type="number"
                            value={inputMinutes}
                            onChange={(e) => setInputMinutes(e.target.value)}
                            className="w-24 h-16 text-2xl text-center"
                            aria-label="Minutes"
                        />
                         <span className="text-2xl font-bold text-muted-foreground">:</span>
                        <Input
                            type="number"
                            value={inputSeconds}
                            onChange={(e) => setInputSeconds(e.target.value)}
                            className="w-24 h-16 text-2xl text-center"
                            aria-label="Seconds"
                        />
                    </div>
                    <Button onClick={handleStartSession} size="lg" className="w-full">
                       <Play className="mr-2"/> Start Focus Session
                    </Button>
                 </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
