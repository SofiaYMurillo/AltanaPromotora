import Image from "next/image";

import type { AboutHeroData } from "../about.types";

type AboutPageHeroProps = {
  data: AboutHeroData;
};

export function AboutPageHero({ data }: AboutPageHeroProps) {
  const { architecturalImage } = data;

  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative overflow-x-hidden bg-primary"
    >
      <div className="container px-[var(--layout-container-padding)] py-16 md:py-20 lg:py-24 xl:py-28">
        <div className="about-hero-grid grid items-center gap-10 md:gap-12 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-x-[clamp(4rem,8vw,10.5rem)] lg:gap-y-12 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] xl:gap-x-[clamp(4.5rem,9vw,11.5rem)] 2xl:gap-x-[clamp(5rem,10vw,12rem)]">
          <div className="about-hero-enter about-hero-content flex max-w-xl flex-col items-start text-left lg:max-w-[30rem] xl:max-w-[32rem]">
            <h1
              id="about-hero-heading"
              className="font-display text-[clamp(2.25rem,1.2rem+3.5vw,3.75rem)] font-bold uppercase leading-[1.08] tracking-[0.05em] text-on-primary"
            >
              {data.title}
            </h1>
            <div
              className="mt-6 h-0.5 w-16 bg-accent"
              aria-hidden="true"
            />
            <p className="mt-6 text-[clamp(1.02rem,0.96rem+0.35vw,1.25rem)] font-light leading-relaxed text-on-primary-muted">
              {data.subtitle}
            </p>
          </div>

          <div
            className="about-hero-enter about-hero-maquette relative mx-auto w-full lg:mx-0 lg:min-w-0 lg:flex lg:justify-end lg:justify-self-end"
            style={{ animationDelay: "90ms" }}
          >
            <div className="about-maquette-float relative mx-auto w-full max-w-[min(100%,36rem)] sm:max-w-[min(100%,40rem)] md:max-w-[min(100%,44rem)] lg:mx-0 lg:w-[min(100%,58vw)] lg:max-w-[min(68rem,calc(100%+3rem))] xl:w-[min(100%,62vw)] xl:max-w-[min(72rem,calc(100%+4rem))] 2xl:w-[min(100%,64vw)] 2xl:max-w-[76rem]">
              <Image
                src={architecturalImage.src}
                alt={architecturalImage.alt}
                width={architecturalImage.width}
                height={architecturalImage.height}
                unoptimized
                priority
                sizes="(max-width: 1023px) min(96vw, 44rem), 62vw"
                className="about-maquette-image ml-auto block h-auto w-full max-h-[min(64vh,38rem)] bg-transparent object-contain object-bottom sm:max-h-[min(70vh,42rem)] md:max-h-[min(74vh,46rem)] lg:max-h-[min(88vh,52rem)] xl:max-h-[min(92vh,58rem)] 2xl:max-h-[min(94vh,62rem)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
