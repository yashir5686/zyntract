import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Alex Johnson',
    role: 'Software Engineer',
    photo: 'https://placehold.co/100x100.png/7DF9FF/222831?text=AJ',
    photoHint: 'profile picture',
    quote: "Zyntract Hub's campaigns gave me the practical experience I needed to land my dream job. The daily challenges kept my skills sharp!",
    rating: 5,
  },
  {
    name: 'Maria Garcia',
    role: 'UX Designer',
    photo: 'https://placehold.co/100x100.png/39FF14/222831?text=MG',
    photoHint: 'profile picture',
    quote: 'The collaborative environment and real-world projects on Zyntract are unparalleled. Highly recommend it to aspiring tech professionals.',
    rating: 5,
  },
  {
    name: 'David Lee',
    role: 'Data Scientist',
    photo: 'https://placehold.co/100x100.png/FFFFFF/222831?text=DL',
    photoHint: 'profile picture',
    quote: "I've learned so much through Zyntract. The platform is intuitive, and the content is top-notch. It's a game-changer.",
    rating: 4,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">
          Hear From Our <span className="text-primary">Community</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card shadow-xl flex flex-col animate-slide-in-up" style={{animationDelay: `${index * 0.15}s`}}>
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <Image
                    src={testimonial.photo}
                    alt={testimonial.name}
                    width={64}
                    height={64}
                    className="rounded-full"
                    data-ai-hint={testimonial.photoHint}
                  />
                  <div>
                    <h3 className="font-headline text-lg font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
              </CardContent>
              <CardFooter className="flex-shrink-0">
                <div className="flex items-center">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating ? 'text-accent fill-accent' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
