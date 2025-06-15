
import { HelpCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 bg-background/95">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Zyntract. All rights reserved.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href="https://forms.gle/PcVD95ToJwUTsonD7" target="_blank" rel="noopener noreferrer">
              <HelpCircle className="mr-2 h-4 w-4" /> Report an Issue
            </a>
          </Button>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <span>Powered by</span>
            <Zap className="h-4 w-4 text-primary" />
            <span>Innovation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
