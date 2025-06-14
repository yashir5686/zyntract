import Image from 'next/image';

const clientLogos = [
  { src: 'https://placehold.co/150x60.png/222831/7DF9FF?text=Client+A', alt: 'Client A Logo', hint: 'company logo' },
  { src: 'https://placehold.co/150x60.png/222831/7DF9FF?text=Client+B', alt: 'Client B Logo', hint: 'company logo' },
  { src: 'https://placehold.co/150x60.png/222831/7DF9FF?text=Client+C', alt: 'Client C Logo', hint: 'company logo' },
  { src: 'https://placehold.co/150x60.png/222831/7DF9FF?text=Client+D', alt: 'Client D Logo', hint: 'company logo' },
  { src: 'https://placehold.co/150x60.png/222831/7DF9FF?text=Client+E', alt: 'Client E Logo', hint: 'company logo' },
  { src: 'https://placehold.co/150x60.png/222831/7DF9FF?text=Client+F', alt: 'Client F Logo', hint: 'company logo' },
];

export default function ClientsSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-center mb-12">
          Trusted by <span className="text-primary">Industry Leaders</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {clientLogos.map((logo, index) => (
            <div key={index} className="flex justify-center animate-fade-in" style={{animationDelay: `${index * 0.1}s`}}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={150}
                height={60}
                className="opacity-70 hover:opacity-100 transition-opacity duration-300"
                data-ai-hint={logo.hint}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
