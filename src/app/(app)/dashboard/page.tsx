'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Plus,
  Upload,
  Code,
  Eye,
  Bookmark,
  Star,
  ChevronRight,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Snippets',
    value: '0',
    icon: Code,
  },
  {
    title: 'Public Snippets',
    value: '0',
    icon: Eye,
  },
  {
    title: 'Saved Snippets',
    value: '0',
    icon: Bookmark,
  },
  {
    title: 'Total Stars',
    value: '0',
    icon: Star,
  },
];

export default function DashboardPage() {
  return (
    <div className="animate-in fade-in-50">
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" /> Create Snippet
          </Button>
          <Button variant="outline" size="lg">
            <Upload className="mr-2 h-4 w-4" /> Import Snippet
          </Button>
        </div>

        <div className="pt-4">
            <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Your Snippets</h2>
            </div>
            <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed shadow-none">
                <div className="text-center p-8 space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                        <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">No Snippets Yet</h3>
                    <p className="text-muted-foreground">You haven't created any snippets. Get started by adding one!</p>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Snippet
                    </Button>
                </div>
            </Card>
        </div>

      </div>
    </div>
  );
}
