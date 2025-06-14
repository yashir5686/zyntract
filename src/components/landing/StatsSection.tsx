import { Users, Briefcase, Zap, Award } from 'lucide-react';

const stats = [
  { icon: <Users className="h-12 w-12 text-primary" />, value: '10,000+', label: 'Active Users' },
  { icon: <Briefcase className="h-12 w-12 text-primary" />, value: '500+', label: 'Campaigns Launched' },
  { icon: <Zap className="h-12 w-12 text-primary" />, value: '1,000,000+', label: 'Problems Solved' },
  { icon: <Award className="h-12 w-12 text-primary" />, value: '95%', label: 'User Satisfaction' },
];

export default function StatsSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">
          Zyntract <span className="text-primary">by the Numbers</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg hover:shadow-primary/20 transition-shadow duration-300 animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="mb-4">{stat.icon}</div>
              <p className="font-headline text-4xl font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-lg text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
