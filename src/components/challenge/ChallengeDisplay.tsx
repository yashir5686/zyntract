import type { DailyChallenge } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, CalendarDays, Brain } from 'lucide-react';

interface ChallengeDisplayProps {
  challenge: DailyChallenge;
}

export default function ChallengeDisplay({ challenge }: ChallengeDisplayProps) {
  const difficultyColor = {
    easy: 'bg-green-500 hover:bg-green-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    hard: 'bg-red-500 hover:bg-red-600',
  };

  return (
    <Card className="w-full shadow-xl bg-card">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-3xl mb-2">{challenge.title}</CardTitle>
          <Badge className={`${difficultyColor[challenge.difficulty]} text-white capitalize`}>
            {challenge.difficulty}
          </Badge>
        </div>
        <CardDescription className="text-sm flex items-center text-muted-foreground space-x-4">
          <span className="flex items-center"><CalendarDays className="w-4 h-4 mr-1" /> {new Date(challenge.date).toLocaleDateString()}</span>
          <span className="flex items-center"><Zap className="w-4 h-4 mr-1 text-accent" /> {challenge.points} Points</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none text-foreground">
            <p className="whitespace-pre-wrap leading-relaxed">{challenge.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
