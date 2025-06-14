import Image from 'next/image';

export default function AboutUsSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 animate-fade-in" style={{animationDelay: '0.2s'}}>
            <Image
              src="https://placehold.co/600x400.png?bg=2A323E&fc=39FF14"
              alt="About Zyntract Team"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl"
              data-ai-hint="team collaboration"
            />
          </div>
          <div className="lg:w-1/2 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-6">
              About <span className="text-primary">Zyntract</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              Zyntract was founded with a mission to bridge the gap between theoretical knowledge and practical industry skills. We believe in learning by doing and empowering individuals to become top-tier software professionals.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              Our platform is built by a team of experienced developers, educators, and industry veterans passionate about fostering talent and driving innovation in the tech world.
            </p>
            <p className="text-lg text-muted-foreground">
              Join us on this exciting journey to shape the future of technology, one challenge and one campaign at a time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
