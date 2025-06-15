'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, Briefcase, Zap, Award } from 'lucide-react';

const statsData = [
  { icon: <Users className="h-12 w-12 text-primary" />, valueString: '10,000+', label: 'Active Users' },
  { icon: <Briefcase className="h-12 w-12 text-primary" />, valueString: '500+', label: 'Campaigns Launched' },
  { icon: <Zap className="h-12 w-12 text-primary" />, valueString: '1,000,000+', label: 'Problems Solved' },
  { icon: <Award className="h-12 w-12 text-primary" />, valueString: '95%', label: 'User Satisfaction' },
];

const parseStatValue = (valueStr: string) => {
  const numericPart = parseInt(valueStr.replace(/[^0-9]/g, ''), 10);
  const suffix = valueStr.replace(/[0-9,]/g, ''); // Extracts '+', '%' or other non-numeric/non-comma characters
  return { number: numericPart || 0, suffix: suffix || '' };
};

interface AnimatedStatCardProps {
  icon: React.ReactNode;
  valueString: string;
  label: string;
  isInView: boolean;
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({ icon, valueString, label, isInView }) => {
  const [count, setCount] = useState(0);
  const { number: endValue, suffix } = parseStatValue(valueString);
  const duration = 1500; // Animation duration in milliseconds

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentAnimatedValue = Math.floor(progress * endValue);
        setCount(currentAnimatedValue);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }
  }, [isInView, endValue, duration]);

  const formatCount = (num: number) => {
    // Add commas for numbers >= 1000
    return num >= 1000 ? num.toLocaleString() : num.toString();
  };

  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <div className="mb-4">{icon}</div>
      <p className="font-headline text-4xl font-bold text-primary mb-2">
        {formatCount(count)}{suffix}
      </p>
      <p className="text-lg text-muted-foreground">{label}</p>
    </div>
  );
};


export default function StatsSection() {
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target); // Ensure animation runs only once
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background" ref={sectionRef}>
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">
          Zyntract <span className="text-primary">by the Numbers</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, index) => (
            <AnimatedStatCard
              key={index}
              icon={stat.icon}
              valueString={stat.valueString}
              label={stat.label}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
