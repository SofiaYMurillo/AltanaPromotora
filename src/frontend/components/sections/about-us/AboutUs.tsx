import Link from "next/link";



import { CoverImage } from "@/frontend/components/common/CoverImage";

import { aboutAttributeIcons } from "@/frontend/components/icons/EditorialIcons";



import type { AboutUsData } from "./aboutUs.types";



type AboutUsProps = {

  data: AboutUsData;

};



export function AboutUs({ data }: AboutUsProps) {

  return (

    <section

      aria-labelledby="about-heading"

      className="section-y bg-background"

    >

      <div className="container">

        <div className="flex flex-col gap-12 lg:flex-row lg:items-stretch lg:justify-between lg:gap-16">

          <div className="relative w-full overflow-hidden lg:w-[48%]">

            <CoverImage

              src={data.image.src}

              alt={data.image.alt}

              sizes="(max-width: 1024px) 100vw, 48vw"

              className="h-[22rem] grayscale sm:h-[26rem] md:h-[30rem] lg:h-[35rem]"

            />

          </div>



          <div className="flex w-full flex-col justify-center lg:w-[48%]">

            <p className="text-[0.9rem] font-bold uppercase tracking-[0.15em] text-bronce">
              {data.eyebrow}
            </p>

            <h2
              id="about-heading"
              className="mt-4 font-display text-heading-lg font-normal text-secondary md:text-[2.5rem] md:leading-[1.25]"
            >

              {data.title}

            </h2>

            <p className="mt-6 text-body-md font-light text-foreground">

              {data.description}

            </p>



            <ul className="mt-8 flex list-none flex-col gap-4">

              {data.attributes.map((attribute) => {

                const Icon = aboutAttributeIcons[attribute.icon];



                return (

                  <li key={attribute.id} className="flex items-start gap-3">

                    <Icon className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 text-accent" />

                    <span className="text-body-md font-medium text-foreground">

                      {attribute.title}

                    </span>

                  </li>

                );

              })}

            </ul>



            <div className="mt-10">

              <Link href={data.cta.href} className="btn-primary">

                {data.cta.label}

              </Link>

            </div>

          </div>

        </div>

      </div>

    </section>

  );

}

