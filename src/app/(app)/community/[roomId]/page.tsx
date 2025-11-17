
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    setDoc,
    serverTimestamp,
    runTransaction,
    increment,
    addDoc,
    where
} from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Crown,
  User,
  Shield,
  HelpCircle,
  Loader2,
  CheckCircle,
  XCircle,
  BrainCircuit,
} from "lucide-react";
import { CatIcon, DogIcon, RabbitIcon, FoxIcon, PandaIcon, BearIcon } from '@/components/icons';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { motion } from 'framer-motion';
import { generateChallengeQuestion, evaluateChallengeAnswer } from '@/ai/flows/daily-challenge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


interface RoomMember {
    userId: string;
    anonymousName: string;
    studyStreak: number;
}

interface RoomDetails {
    id: string;
    name: string;
    description: string;
    memberCount: number;
}

interface DailyChallenge {
    id: string;
    question: string;
}

interface ChallengeAnswer {
    id: string;
    userId: string;
    answer: string;
    isCorrect: boolean;
    feedback: string;
    submittedAt: any;
}

const rankIcons = [
    <Crown key="1" className="h-5 w-5 text-yellow-400" />,
    <Shield key="2" className="h-5 w-5 text-gray-400" />,
    <Shield key="3" className="h-5 w-5 text-yellow-600" />,
];

const animalIcons = [CatIcon, DogIcon, RabbitIcon, FoxIcon, PandaIcon, BearIcon];

// Simple hash function to pick a consistent icon for a user
const getAnimalIcon = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % animalIcons.length;
    return animalIcons[index];
};


export default function RoomPage() {
    const { roomId } = useParams();
    const { user, loading: userLoading } = useAuth();
    const router = useRouter();

    const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    
    // Daily Challenge State
    const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
    const [userAnswer, setUserAnswer] = useState<ChallengeAnswer | null>(null);
    const [answerText, setAnswerText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evalResult, setEvalResult] = useState<{isCorrect: boolean, feedback: string} | null>(null);
    const today = format(new Date(), 'yyyy-MM-dd');

    const fetchRoomData = useCallback(async () => {
        if (!roomId || userLoading || !user) return;
        
        setIsLoading(true);

        const roomDocRef = doc(firestore, 'communityRooms', roomId as string);
        getDoc(roomDocRef).then(roomSnap => {
            if (roomSnap.exists()) {
                const roomData = { id: roomSnap.id, ...roomSnap.data() } as RoomDetails;
                setRoomDetails(roomData);

                // Now fetch members
                const membersCollection = collection(firestore, `communityRooms/${roomId}/members`);
                const q = query(membersCollection, orderBy('studyStreak', 'desc'));
                getDocs(q).then(membersSnap => {
                    const memberData = membersSnap.docs.map(doc => doc.data() as RoomMember);
                    setMembers(memberData);

                    const isUserMember = user ? memberData.some(m => m.userId === user.uid) : false;
                    if (user && isUserMember) {
                        // Fetch or create daily challenge
                        const challengeDocRef = doc(firestore, `communityRooms/${roomId}/challenges`, today);
                        getDoc(challengeDocRef).then(challengeSnap => {
                             if (challengeSnap.exists()) {
                                setChallenge({ id: challengeSnap.id, ...challengeSnap.data() } as DailyChallenge);
                            } else if (roomData.name && user.profile?.gradeLevel) {
                                generateChallengeQuestion(roomData.name, user.profile.gradeLevel).then(({ question }) => {
                                    const newChallenge = { question, roomId, createdAt: serverTimestamp() };
                                    setDoc(challengeDocRef, newChallenge)
                                    .catch(async (serverError) => {
                                        const permissionError = new FirestorePermissionError({
                                        path: challengeDocRef.path,
                                        operation: 'create',
                                        requestResourceData: newChallenge,
                                        });
                                        errorEmitter.emit('permission-error', permissionError);
                                    });
                                    setChallenge({ id: today, question });
                                });
                            }
                        }).catch(async (serverError) => {
                             const permissionError = new FirestorePermissionError({ path: challengeDocRef.path, operation: 'get' });
                             errorEmitter.emit('permission-error', permissionError);
                        });

                        // Fetch user's answer for today
                        const answersCollection = collection(firestore, `communityRooms/${roomId}/challenges/${today}/answers`);
                        const answerQuery = query(answersCollection, where("userId", "==", user.uid));
                        getDocs(answerQuery).then(answerSnap => {
                            if (!answerSnap.empty) {
                                const doc = answerSnap.docs[0];
                                setUserAnswer({id: doc.id, ...doc.data()} as ChallengeAnswer);
                            }
                        }).catch(async (serverError) => {
                             const permissionError = new FirestorePermissionError({ path: answersCollection.path, operation: 'list' });
                             errorEmitter.emit('permission-error', permissionError);
                        });
                    }

                }).catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({ path: collection(firestore, `communityRooms/${roomId}/members`).path, operation: 'list' });
                    errorEmitter.emit('permission-error', permissionError);
                }).finally(() => {
                    setIsLoading(false);
                });

            } else {
                router.push('/community');
                return;
            }
        }).catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({ path: roomDocRef.path, operation: 'get' });
            errorEmitter.emit('permission-error', permissionError);
            setIsLoading(false);
        });

    }, [roomId, user, userLoading, router, today]);


    useEffect(() => {
        if (!userLoading) {
            fetchRoomData();
        }
    }, [userLoading, user, fetchRoomData]);

    const handleJoinRoom = async () => {
        if (!user || !roomId) return;
        setIsJoining(true);

        const roomDocRef = doc(firestore, 'communityRooms', roomId as string);
        const memberDocRef = doc(firestore, `communityRooms/${roomId}/members`, user.uid);
        
        runTransaction(firestore, async (transaction) => {
            const memberDoc = await transaction.get(memberDocRef);
            if (!memberDoc.exists()) {
                const anonymousName: string = uniqueNamesGenerator({ dictionaries: [adjectives, animals], separator: ' ', style: 'capital' });
                // We cannot reliably get user streak from a transaction like this without fetching first.
                // Assuming streak is 0 for simplicity on join, or it would need to be passed in.
                const userStreak = user.studyStreak || 0;
                
                const newMember = { 
                    userId: user.uid, 
                    anonymousName, 
                    studyStreak: userStreak,
                    joinedAt: serverTimestamp()
                };
                
                transaction.set(memberDocRef, newMember);
                transaction.update(roomDocRef, { memberCount: increment(1) });
            }
        }).then(() => {
             fetchRoomData();
        }).catch(async (serverError) => {
             const permissionError = new FirestorePermissionError({
                path: memberDocRef.path,
                operation: 'create',
            });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsJoining(false);
        });
    };
    
    const handleSubmitAnswer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !challenge || !answerText.trim()) return;
        setIsSubmitting(true);
        setEvalResult(null);

        evaluateChallengeAnswer({ question: challenge.question, answer: answerText })
          .then(result => {
            setEvalResult(result);

            const answerCollectionRef = collection(firestore, `communityRooms/${roomId}/challenges/${challenge.id}/answers`);
            const newAnswerDoc = {
                userId: user.uid,
                answer: answerText,
                isCorrect: result.isCorrect,
                feedback: result.feedback,
                submittedAt: serverTimestamp()
            };

            addDoc(answerCollectionRef, newAnswerDoc)
              .then(docRef => {
                // Immediately set the user's answer state to lock the UI
                setUserAnswer({ ...newAnswerDoc, id: docRef.id, submittedAt: new Date() });
              })
              .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                  path: answerCollectionRef.path,
                  operation: 'create',
                  requestResourceData: newAnswerDoc,
                });
                errorEmitter.emit('permission-error', permissionError);
              });
        }).catch (error => {
            console.error("Error submitting answer:", error);
        }).finally(() => {
            setIsSubmitting(false);
        });
    };

    const isUserInRoom = members.some(m => m.userId === user?.uid);

    if (isLoading || userLoading) {
        return (
             <div className="space-y-4">
                <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md"></div>
                <div className="h-64 bg-muted animate-pulse rounded-xl"></div>
            </div>
        )
    }

    if (!roomDetails) { return <div>Room not found.</div>; }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl md:text-3xl font-extrabold">{roomDetails.name}</CardTitle>
                    <CardDescription>{roomDetails.description}</CardDescription>
                </CardHeader>
                {!isUserInRoom && user && (
                    <CardContent>
                         <Button onClick={handleJoinRoom} disabled={isJoining}>
                            {isJoining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</> : 'Join Room & Share Streak'}
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* Daily Challenge Card */}
            {isUserInRoom && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2"><HelpCircle className="text-primary"/> Daily Challenge</CardTitle>
                        <CardDescription>Test your knowledge with today's question.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {challenge ? (
                            <div className="space-y-4">
                                <p className="font-semibold text-lg bg-secondary p-4 rounded-md">{challenge.question}</p>
                                {userAnswer ? (
                                    <Alert variant={userAnswer.isCorrect ? 'default' : 'destructive'} className={userAnswer.isCorrect ? "border-green-500/50" : ""}>
                                        <AlertTitle className="flex items-center gap-2">
                                            {userAnswer.isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle />}
                                            Evaluation Complete
                                        </AlertTitle>
                                        <AlertDescription>
                                            <p className="font-bold mb-2">Your Answer: "{userAnswer.answer}"</p>
                                            {userAnswer.feedback}
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <form onSubmit={handleSubmitAnswer} className="space-y-4">
                                        <Textarea 
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="Type your answer here..."
                                            disabled={isSubmitting}
                                        />
                                        <Button type="submit" disabled={isSubmitting || !answerText.trim()}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Submit Answer
                                        </Button>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <BrainCircuit className="h-10 w-10 mx-auto mb-2 animate-pulse"/>
                                <p>Generating today's challenge...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Leaderboard</CardTitle>
                    <CardDescription>Top students by study streak.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead className="text-right">Study Streak</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member, index) => {
                                const AnimalIcon = getAnimalIcon(member.anonymousName);
                                return (
                                <TableRow key={member.userId} className={member.userId === user?.uid ? "bg-accent" : ""}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center justify-center h-full">
                                            {rankIcons[index] || index + 1}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <AnimalIcon className="h-5 w-5" />
                                            <span>{member.anonymousName} {member.userId === user?.uid && "(You)"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{member.studyStreak} days</TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    {members.length === 0 && (
                        <div className="text-center text-muted-foreground p-8">
                            <User className="h-10 w-10 mx-auto mb-2" />
                            <p>This room is empty. Be the first to join!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
