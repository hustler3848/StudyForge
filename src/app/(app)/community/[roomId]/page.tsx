
'use client';

import { useEffect, useState } from 'react';
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
import { Crown, User, Shield, Cat, Dog, Rabbit, Fox, Bear, Panda, Koala, Tiger, Lion, HelpCircle, Loader2, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { motion } from 'framer-motion';
import { generateChallengeQuestion, evaluateChallengeAnswer } from '@/ai/flows/daily-challenge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

interface RoomMember {
    userId: string;
    anonymousName: string;
    studyStreak: number;
}

interface RoomDetails {
    id: string;
    name: string;
    description: string;
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
}

const rankIcons = [
    <Crown key="1" className="h-5 w-5 text-yellow-400" />,
    <Shield key="2" className="h-5 w-5 text-gray-400" />,
    <Shield key="3" className="h-5 w-5 text-yellow-600" />,
];

const animalIcons = [Cat, Dog, Rabbit, Fox, Bear, Panda, Koala, Tiger, Lion];

const getAnimalIcon = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const Icon = animalIcons[hash % animalIcons.length];
    return <Icon className="h-5 w-5" />;
}

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

    useEffect(() => {
        if (!roomId || !user) return;
        
        const fetchRoomData = async () => {
            setIsLoading(true);
            try {
                // Fetch room details
                const roomDocRef = doc(firestore, 'communityRooms', roomId as string);
                const roomSnap = await getDoc(roomDocRef);
                if (roomSnap.exists()) {
                    setRoomDetails({ id: roomSnap.id, ...roomSnap.data() } as RoomDetails);
                } else {
                    router.push('/community');
                    return;
                }

                // Fetch room members (leaderboard)
                const membersCollection = collection(firestore, `communityRooms/${roomId}/members`);
                const q = query(membersCollection, orderBy('studyStreak', 'desc'));
                const membersSnap = await getDocs(q);
                setMembers(membersSnap.docs.map(doc => doc.data() as RoomMember));
                
                // Fetch or create daily challenge
                const challengeDocRef = doc(firestore, `communityRooms/${roomId}/challenges`, today);
                const challengeSnap = await getDoc(challengeDocRef);
                if (challengeSnap.exists()) {
                    setChallenge({ id: challengeSnap.id, ...challengeSnap.data() } as DailyChallenge);
                } else {
                    const { question } = await generateChallengeQuestion(roomSnap.data().name);
                    await setDoc(challengeDocRef, { question, roomId });
                    setChallenge({ id: today, question });
                }

                // Fetch user's answer for today
                if (user) {
                    const answersCollection = collection(firestore, `communityRooms/${roomId}/challenges/${today}/answers`);
                    const answerQuery = query(answersCollection, where("userId", "==", user.uid));
                    const answerSnap = await getDocs(answerQuery);
                    if (!answerSnap.empty) {
                        const doc = answerSnap.docs[0];
                        setUserAnswer({id: doc.id, ...doc.data()} as ChallengeAnswer);
                    }

                }


            } catch (error) {
                console.error("Error fetching room data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoomData();
    }, [roomId, user, router, today]);

    const handleJoinRoom = async () => {
        if (!user || !roomId) return;
        setIsJoining(true);
        try {
            const roomDocRef = doc(firestore, 'communityRooms', roomId as string);
            const memberDocRef = doc(firestore, `communityRooms/${roomId}/members`, user.uid);

            await runTransaction(firestore, async (transaction) => {
                const memberDoc = await transaction.get(memberDocRef);
                if (!memberDoc.exists()) {
                    const anonymousName: string = uniqueNamesGenerator({ dictionaries: [adjectives, animals], separator: ' ', style: 'capital' });
                    const newMember: RoomMember = { userId: user.uid, anonymousName, studyStreak: user.studyStreak || 0 };
                    transaction.set(memberDocRef, { ...newMember, joinedAt: serverTimestamp() });
                    transaction.update(roomDocRef, { memberCount: increment(1) });
                    setMembers(prev => [...prev, newMember].sort((a, b) => b.studyStreak - a.studyStreak));
                }
            });
        } catch (error) {
            console.error("Error joining room:", error);
        } finally {
            setIsJoining(false);
        }
    };
    
    const handleSubmitAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !challenge || !answerText) return;
        setIsSubmitting(true);
        setEvalResult(null);
        try {
            const result = await evaluateChallengeAnswer({ question: challenge.question, answer: answerText });
            setEvalResult(result);

            const answerCollectionRef = collection(firestore, `communityRooms/${roomId}/challenges/${challenge.id}/answers`);
            const newAnswer: Omit<ChallengeAnswer, 'id'> = {
                userId: user.uid,
                answer: answerText,
                isCorrect: result.isCorrect,
                feedback: result.feedback,
            };
            const docRef = await addDoc(answerCollectionRef, { ...newAnswer, submittedAt: serverTimestamp() });
            setUserAnswer({ ...newAnswer, id: docRef.id });

        } catch (error) {
            console.error("Error submitting answer:", error);
        } finally {
            setIsSubmitting(false);
        }
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
                    <CardTitle className="text-2xl md:text-3xl font-extrabold">{roomDetails.name}</CardTitle>
                    <CardDescription>{roomDetails.description}</CardDescription>
                </CardHeader>
                {!isUserInRoom && (
                    <CardContent>
                         <Button onClick={handleJoinRoom} disabled={isJoining}>
                            {isJoining ? 'Joining...' : 'Join Room & Share Streak'}
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* Daily Challenge Card */}
            {isUserInRoom && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HelpCircle className="text-primary"/> Daily Challenge</CardTitle>
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
                                ) : evalResult ? (
                                     <Alert variant={evalResult.isCorrect ? 'default' : 'destructive'} className={evalResult.isCorrect ? "border-green-500/50" : ""}>
                                        <AlertTitle className="flex items-center gap-2">
                                            {evalResult.isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle />}
                                            Evaluation Complete
                                        </AlertTitle>
                                        <AlertDescription>{evalResult.feedback}</AlertDescription>
                                    </Alert>
                                ) : (
                                    <form onSubmit={handleSubmitAnswer} className="space-y-4">
                                        <Textarea 
                                            value={answerText}
                                            onChange={(e) => setAnswerText(e.target.value)}
                                            placeholder="Type your answer here..."
                                            disabled={isSubmitting}
                                        />
                                        <Button type="submit" disabled={isSubmitting}>
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
                            {members.map((member, index) => (
                                <TableRow key={member.userId} className={member.userId === user?.uid ? "bg-accent" : ""}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center justify-center h-full">
                                            {rankIcons[index] || index + 1}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {getAnimalIcon(member.anonymousName)}
                                            <span>{member.anonymousName} {member.userId === user?.uid && "(You)"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{member.studyStreak} days</TableCell>
                                </TableRow>
                            ))}
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
