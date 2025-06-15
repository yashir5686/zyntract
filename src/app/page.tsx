import HeroSection from '@/components/landing/HeroSection';
import WhatWeDoSection from '@/components/landing/WhatWeDoSection';
import AboutUsSection from '@/components/landing/AboutUsSection';
import ClientsSection from '@/components/landing/ClientsSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import StatsSection from '@/components/landing/StatsSection';
import CTASection from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <WhatWeDoSection />
      <AboutUsSection />
      <StatsSection />
      <ClientsSection />
      {/* <TestimonialsSection /> */}
      <CTASection />
    </div>
  );
}
