import Link from "next/link";

import type { AboutFinalCtaData } from "../about.types";

type AboutFinalCtaSectionProps = {
  data: AboutFinalCtaData;
};

export function AboutFinalCtaSection({ data }: AboutFinalCtaSectionProps) {
  return (
    <section
      aria-labelledby="about-final-cta-heading"
      className="bg-background px-6 py-16 md:px-8 md:py-24"
    >
      <div className="container flex flex-col items-center">
        <div className="flex max-w-[55rem] flex-col items-center gap-12 text-center">
          <div className="flex flex-col items-center gap-5">
            <h2
              id="about-final-cta-heading"
              className="font-display text-[clamp(1.75rem,1.2rem+2vw,3rem)] font-medium leading-[1.2] text-foreground"
            >
              {data.title}
            </h2>
            <p className="max-w-[40rem] text-body-md text-secondary md:text-body-lg">
              {data.description}
            </p>
          </div>
          <Link href={data.cta.href} className="btn-primary">
            {data.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
