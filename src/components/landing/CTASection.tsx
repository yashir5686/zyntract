import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-r from-primary via-accent/80 to-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-headline text-3xl md:text-5xl font-bold mb-6">
          Ready to Elevate Your Tech Career?
        </h2>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Join Zyntract today and start your journey towards becoming a skilled software professional. Engage in exciting campaigns, solve daily challenges, and connect with a vibrant community.
        </p>
        <Button asChild size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90 shadow-xl transition-transform hover:scale-105">
          <Link href="/dashboard">
            Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
