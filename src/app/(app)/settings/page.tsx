
"use client";

import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

const StudyStreak = ({ streak }: { streak: number }) => (
  <div className="p-6 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-400 text-primary-foreground text-center">
    <Trophy className="h-12 w-12 mx-auto text-yellow-300" />
    <h3 className="text-4xl font-bold mt-2">{streak}</h3>
    <p className="font-semibold text-lg">Day Study Streak!</p>
    <p className="text-sm opacity-80 mt-1">Keep up the great work!</p>
  </div>
);

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


export default function SettingsPage() {
  const { user } = useAuth();
  const studyStreak = user?.studyStreak || 0;
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <motion.div 
      className="space-y-8 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="space-y-2" variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, profile, and achievements.
        </p>
      </motion.div>

      <motion.div 
        className="grid gap-8 md:grid-cols-3"
        variants={containerVariants}
      >
        <motion.div className="md:col-span-2 space-y-8" variants={itemVariants}>
            {/* Profile Section */}
            <Card>
                <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                    This is how your profile information is configured.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-xl">{getInitials(user?.displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="font-semibold text-lg">{user?.displayName}</p>
                    <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <h4 className="font-semibold">Grade Level</h4>
                    <p className="text-muted-foreground">{user?.profile?.gradeLevel || 'Not set'}</p>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                    {user?.profile?.subjects?.map(subject => (
                        <Badge key={subject} variant="secondary">{subject}</Badge>
                    ))}
                    {(!user?.profile?.subjects || user.profile.subjects.length === 0) && (
                        <p className="text-sm text-muted-foreground">No subjects added.</p>
                    )}
                    </div>
                </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div className="space-y-8" variants={itemVariants}>
             {/* Achievements Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                    {studyStreak > 0 ? (
                        <StudyStreak streak={studyStreak} />
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            <Trophy className="h-10 w-10 mx-auto mb-2" />
                            <p>Your achievements will appear here. Start a study session to get your first badge!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
