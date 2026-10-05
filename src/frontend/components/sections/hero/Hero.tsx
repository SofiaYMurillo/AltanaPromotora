import Link from "next/link";



import { SectionBackgroundMedia } from "@/frontend/components/common/SectionBackgroundMedia";



import type { HeroData } from "./hero.types";



interface HeroProps {

  data: HeroData;

}



function renderHeadingLine(line: string, accentText?: string) {

  if (!accentText) {

    return line;

  }



  const matchIndex = line.toLocaleLowerCase("es").lastIndexOf(

    accentText.toLocaleLowerCase("es"),

  );



  if (matchIndex < 0) {

    return line;

  }



  const before = line.slice(0, matchIndex);

  const matched = line.slice(matchIndex, matchIndex + accentText.length);

  const after = line.slice(matchIndex + accentText.length);



  return (

    <>

      {before}

      <span className="text-accent">{matched}</span>

      {after}

    </>

  );

}



export function Hero({ data }: HeroProps) {

  const {
    headingLines,
    accentText,
    subheading,
    cta,
    secondaryCta,
    image,
    cmsBackground,
  } = data;

  const background = cmsBackground ?? { type: "none" as const };
  const showOverlay =
    background.type === "image" ||
    background.type === "video" ||
    background.type === "none";



  return (

    <section

      aria-labelledby="hero-heading"

      className="relative isolate min-h-[88svh] overflow-hidden md:min-h-[92svh] lg:min-h-[min(92svh,920px)]"

    >

      <div className="absolute inset-0">
        <SectionBackgroundMedia
          background={background}
          fallbackImage={image}
          sizes="100vw"
        />
      </div>

      {showOverlay ? (
        <div
          className="absolute inset-0 bg-[rgb(25_28_33/0.77)]"
          aria-hidden="true"
        />
      ) : null}



      <div className="container relative flex min-h-[88svh] flex-col justify-center py-28 md:min-h-[92svh] md:py-36 lg:min-h-[min(92svh,920px)] lg:py-36">

        <div className="hero-copy flex w-full max-w-[42rem] flex-col items-start text-left">

          <h1

            id="hero-heading"

            className="text-display-lg uppercase text-background lg:text-display-xl"

          >

            {headingLines.map((line) => (

              <span key={line} className="block">

                {renderHeadingLine(line, accentText)}

              </span>

            ))}

          </h1>



          <div className="accent-rule mt-8 h-0.5 w-20" aria-hidden="true" />



          <p className="mt-5 max-w-xl text-body-md font-light text-[#F2F2F2] md:text-body-lg">

            {subheading}

          </p>



          <div className="mt-10 flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center">

            <Link href={cta.href} className="btn-primary btn-primary-lg">

              {cta.label}

            </Link>

            {secondaryCta ? (

              <Link

                href={secondaryCta.href}

                className="btn-primary-outline btn-primary-lg"

              >

                {secondaryCta.label}

              </Link>

            ) : null}

          </div>

        </div>

      </div>

    </section>

  );

}

