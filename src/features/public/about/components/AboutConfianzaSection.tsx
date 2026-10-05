import type { AboutConfianzaData } from "../about.types";

type AboutConfianzaSectionProps = {
  data: AboutConfianzaData;
};

function QuoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-10 w-10 text-accent"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V14h5v-5H5.5a2.5 2.5 0 0 1 2.5-2.5V6H7.17zm10 0A5.17 5.17 0 0 0 12 11.17V14h5v-5h-1.5a2.5 2.5 0 0 1 2.5-2.5V6h-1.83z" />
    </svg>
  );
}

export function AboutConfianzaSection({ data }: AboutConfianzaSectionProps) {
  return (
    <section
      aria-labelledby="about-confianza-heading"
      className="flex flex-col items-center bg-primary px-6 py-20 text-center md:px-12 md:py-28"
    >
      <QuoteIcon />
      <h2
        id="about-confianza-heading"
        className="mt-8 max-w-4xl font-display text-[1.5rem] font-semibold uppercase tracking-[0.15em] text-accent"
      >
        {data.title}
      </h2>
      <div className="mt-8 h-px w-16 bg-accent" aria-hidden="true" />
      <blockquote className="mt-8 max-w-[52rem] font-display text-[clamp(1.35rem,1rem+1.2vw,2.2rem)] font-normal leading-[1.45] text-background">
        “{data.quote}”
      </blockquote>
    </section>
  );
}
