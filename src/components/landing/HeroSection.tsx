import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-background to-secondary/30">
      <div className="container mx-auto px-4 text-center">
        <Zap className="mx-auto h-16 w-16 text-primary mb-6 animate-pulse" />
        <h1 className="font-headline text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Welcome to <span className="text-primary">Zyntract Hub</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          Unlock your potential with our cutting-edge campaigns and daily challenges. Join a community of innovators and builders.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
            <Link href="/dashboard">
              Explore Campaigns <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-lg transition-transform hover:scale-105 border-primary text-primary hover:bg-primary/10">
            <Link href="/challenge">
              Today's Challenge <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <Image
            src="https://placehold.co/1200x600.png?bg=2A323E&fc=7DF9FF"
            alt="Zyntract Platform Showcase"
            width={1200}
            height={600}
            className="rounded-lg shadow-2xl mx-auto"
            data-ai-hint="technology abstract"
            priority
          />
        </div>
      </div>
    </section>
  );
}
