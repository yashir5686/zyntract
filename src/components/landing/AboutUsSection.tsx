
export default function AboutUsSection() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center"> {/* Centering content */}
          {/* Image div has been removed */}
          <div className="w-full max-w-3xl animate-fade-in lg:text-left" style={{animationDelay: '0.2s'}}>
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
