
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Book, Code, GraduationCap, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface CommunityRoom {
    id: string;
    name: string;
    description: string;
    memberCount: number;
}

const iconMap: { [key: string]: React.ElementType } = {
    'Math': Book,
    'Computer Science': Code,
    'Final Exam': GraduationCap,
    'default': Users
};

const defaultRooms: Omit<CommunityRoom, 'memberCount'>[] = [
    { id: 'math-students', name: 'Math Students Room', description: 'For all the calculus crusaders and algebra aces.' },
    { id: 'cs-wizards', name: 'Computer Science Room', description: 'Code, algorithms, and everything in between.' },
    { id: 'final-exam-prep', name: 'Final Exam Room', description: 'The final push! Let\'s get through it together.' },
];

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


export default function CommunityPage() {
    const [rooms, setRooms] = useState<CommunityRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setupAndFetchRooms = async () => {
            setIsLoading(true);
            const roomsCollection = collection(firestore, 'communityRooms');

            // Ensure default rooms exist
            for (const room of defaultRooms) {
                const roomDocRef = doc(firestore, 'communityRooms', room.id);
                const roomSnap = await getDoc(roomDocRef);
                if (!roomSnap.exists()) {
                    await setDoc(roomDocRef, {
                        name: room.name,
                        description: room.description,
                        memberCount: 0,
                    });
                }
            }

            // Fetch all rooms to display
            const roomsSnapshot = await getDocs(roomsCollection);
            const roomsList = roomsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CommunityRoom));
            
            setRooms(roomsList);
            setIsLoading(false);
        };
        
        setupAndFetchRooms();
    }, []);

    const getIcon = (name: string) => {
        for (const key in iconMap) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return iconMap[key];
            }
        }
        return iconMap.default;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-8 w-1/3 bg-muted animate-pulse rounded-md"></div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-muted animate-pulse rounded-xl"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Community Rooms</h1>
                <p className="text-muted-foreground mt-2">Join a room to share your progress and get motivated.</p>
            </motion.div>

            <motion.div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
            >
                {rooms.map((room) => {
                    const Icon = getIcon(room.name);
                    return (
                        <motion.div key={room.id} variants={itemVariants}>
                            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <Icon className="h-8 w-8 text-primary" />
                                        <CardTitle>{room.name}</CardTitle>
                                    </div>
                                    <CardDescription>{room.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <div className="text-sm text-muted-foreground flex items-center">
                                        <Users className="h-4 w-4 mr-2" />
                                        <span>{room.memberCount || 0} Members</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/community/${room.id}`}>
                                            View Room <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
}
