import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t border-border/40 bg-background/95">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Zyntract Hub. All rights reserved.
        </p>
        <div className="flex items-center space-x-1 text-muted-foreground">
          <span>Powered by</span>
          <Zap className="h-4 w-4 text-primary" />
          <span>Innovation</span>
        </div>
      </div>
    </footer>
  );
}
