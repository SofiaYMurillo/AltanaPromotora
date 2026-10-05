import Link from "next/link";

import { CoverImage } from "@/frontend/components/common/CoverImage";

import type { AboutHistoriaData } from "../about.types";

type AboutHistoriaSectionProps = {
  data: AboutHistoriaData;
};

export function AboutHistoriaSection({ data }: AboutHistoriaSectionProps) {
  return (
    <section
      aria-labelledby="about-historia-heading"
      className="bg-background px-6 py-16 md:px-12 md:py-24 lg:px-20"
    >
      <div className="container flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="relative h-[22rem] w-full sm:h-[28rem] md:h-[32rem] lg:h-[38rem] lg:w-[46%]">
          <CoverImage
            src={data.image.src}
            alt={data.image.alt}
            sizes="(max-width: 1024px) 100vw, 46vw"
          />
        </div>

        <div className="flex w-full flex-col items-start lg:w-[48%]">
          <p className="text-[0.85rem] font-semibold uppercase tracking-[0.2em] text-accent">
            {data.eyebrow}
          </p>
          <h2
            id="about-historia-heading"
            className="mt-4 font-display text-[2rem] font-semibold leading-[1.2] text-secondary"
          >
            {data.title}
          </h2>
          <div className="mt-5 h-px w-16 bg-accent" aria-hidden="true" />
          <p className="mt-6 text-body-md font-light leading-relaxed text-foreground">
            {data.paragraphs[0]}
          </p>
          <p className="mt-4 text-body-md font-light leading-relaxed text-foreground">
            {data.paragraphs[1]}
          </p>
          <Link href={data.cta.href} className="btn-primary mt-8">
            {data.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
