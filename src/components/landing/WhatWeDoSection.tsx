import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Brain, Users, Briefcase } from 'lucide-react';

const features = [
  {
    icon: <Zap className="h-10 w-10 text-primary mb-4" />,
    title: 'Innovative Campaigns',
    description: 'Engage in dynamic campaigns designed to boost your skills and project portfolio in various tech domains.',
  },
  {
    icon: <Brain className="h-10 w-10 text-primary mb-4" />,
    title: 'Daily Challenges',
    description: 'Sharpen your problem-solving abilities with daily coding challenges curated by industry experts.',
  },
  {
    icon: <Users className="h-10 w-10 text-primary mb-4" />,
    title: 'Community & Networking',
    description: 'Connect with like-minded individuals, collaborate on projects, and grow your professional network.',
  },
  {
    icon: <Briefcase className="h-10 w-10 text-primary mb-4" />,
    title: 'Career Growth',
    description: 'Gain practical experience, build a strong profile, and unlock new career opportunities in the tech industry.',
  },
];

export default function WhatWeDoSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-4">
          What We <span className="text-primary">Do</span>
        </h2>
        <p className="text-lg text-muted-foreground text-center max-w-xl mx-auto mb-12">
          Zyntract Hub is your gateway to real-world tech experience. We provide a platform for learning, collaboration, and growth.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center bg-card shadow-xl hover:shadow-primary/30 transition-shadow duration-300 animate-slide-in-up" style={{animationDelay: `${index * 0.1}s`}}>
              <CardHeader>
                <div className="flex justify-center">{feature.icon}</div>
                <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
