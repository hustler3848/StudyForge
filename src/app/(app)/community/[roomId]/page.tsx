
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
    increment
} from 'firebase/firestore';
import { firestore } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown, User, Shield, Cat, Dog, Rabbit, Fox, Bear, Panda, Koala, Tiger, Lion } from 'lucide-react';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { motion } from 'framer-motion';

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

const rankIcons = [
    <Crown key="1" className="h-5 w-5 text-yellow-400" />,
    <Shield key="2" className="h-5 w-5 text-gray-400" />,
    <Shield key="3" className="h-5 w-5 text-yellow-600" />,
];

const animalIcons = [Cat, Dog, Rabbit, Fox, Bear, Panda, Koala, Tiger, Lion];

const getAnimalIcon = (name: string) => {
    // A simple hash function to pick an icon
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

    useEffect(() => {
        if (!roomId) return;
        const fetchRoomData = async () => {
            setIsLoading(true);
            try {
                // Fetch room details
                const roomDocRef = doc(firestore, 'communityRooms', roomId as string);
                const roomSnap = await getDoc(roomDocRef);
                if (roomSnap.exists()) {
                    setRoomDetails({ id: roomSnap.id, ...roomSnap.data() } as RoomDetails);
                } else {
                    router.push('/community'); // Room not found
                    return;
                }

                // Fetch room members (leaderboard)
                const membersCollection = collection(firestore, `communityRooms/${roomId}/members`);
                const q = query(membersCollection, orderBy('studyStreak', 'desc'));
                const membersSnap = await getDocs(q);
                const membersData = membersSnap.docs.map(doc => doc.data() as RoomMember);
                setMembers(membersData);

            } catch (error) {
                console.error("Error fetching room data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoomData();
    }, [roomId, router]);

    const handleJoinRoom = async () => {
        if (!user || !roomId) return;
        setIsJoining(true);
        try {
            const roomDocRef = doc(firestore, 'communityRooms', roomId as string);
            const memberDocRef = doc(firestore, `communityRooms/${roomId}/members`, user.uid);

            await runTransaction(firestore, async (transaction) => {
                const memberDoc = await transaction.get(memberDocRef);

                if (memberDoc.exists()) {
                    // Already a member, maybe update streak
                    transaction.update(memberDocRef, { studyStreak: user.studyStreak || 0 });
                } else {
                    // New member
                    const anonymousName: string = uniqueNamesGenerator({
                        dictionaries: [adjectives, animals],
                        separator: ' ',
                        style: 'capital',
                    });

                    const newMember: RoomMember = {
                        userId: user.uid,
                        anonymousName,
                        studyStreak: user.studyStreak || 0,
                    };
                    
                    transaction.set(memberDocRef, { ...newMember, joinedAt: serverTimestamp() });
                    transaction.update(roomDocRef, { memberCount: increment(1) });
                    
                    // Add to local state immediately
                    setMembers(prev => [...prev, newMember].sort((a, b) => b.studyStreak - a.studyStreak));
                }
            });

        } catch (error) {
            console.error("Error joining room:", error);
        } finally {
            setIsJoining(false);
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

    if (!roomDetails) {
        return <div>Room not found.</div>;
    }

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
                            <Users className="h-10 w-10 mx-auto mb-2" />
                            <p>This room is empty. Be the first to join!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

    