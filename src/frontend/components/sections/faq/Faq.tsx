import { FaqBlock } from "./FaqBlock";
import type { FaqData } from "./faq.types";

type FaqProps = {
  data: FaqData;
};

export function Faq({ data }: FaqProps) {
  return (
    <section
      aria-labelledby="faq-heading"
      className="bg-background py-12 md:py-14 lg:py-[3.25rem]"
    >
      <div className="container">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12 xl:gap-16">
          <div className="lg:w-1/3 lg:shrink-0">
            <h2
              id="faq-heading"
              className="font-display text-heading-lg uppercase tracking-wide text-accent md:text-[1.8rem]"
            >
              {data.title}
            </h2>
            <div
              className="mt-4 h-0.5 w-20 bg-accent"
              aria-hidden="true"
            />
            <p className="mt-4 max-w-md text-body-sm text-secondary md:text-body-md">
              {data.description}
            </p>
          </div>

          <ul className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:w-2/3 lg:gap-8">
            {data.blocks.map((block) => (
              <li key={block.id}>
                <FaqBlock block={block} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
