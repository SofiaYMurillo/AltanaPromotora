import type { AboutValoresData, AboutValueItem } from "../about.types";

type AboutValoresSectionProps = {
  data: AboutValoresData;
};

function ValueIcon({ icon }: { icon: AboutValueItem["icon"] }) {
  const svgProps = {
    viewBox: "0 0 24 24",
    className: "h-5 w-5 text-accent",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    "aria-hidden": true as const,
  };

  if (icon === "transparency") {
    return (
      <svg {...svgProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4.2-4.2" />
      </svg>
    );
  }

  if (icon === "commitment") {
    return (
      <svg {...svgProps}>
        <path d="M7 11h10M7 11l2-2m-2 2 2 2M17 13H7m10 0-2-2m2 2-2 2" />
        <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7" />
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 11h16" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

export function AboutValoresSection({ data }: AboutValoresSectionProps) {
  return (
    <section
      aria-labelledby="about-valores-heading"
      className="bg-background px-6 py-16 md:px-8 md:py-24"
    >
      <div className="container flex flex-col items-center">
        <p className="text-[0.85rem] font-semibold uppercase tracking-[0.15em] text-accent">
          {data.eyebrow}
        </p>
        <h2
          id="about-valores-heading"
          className="mt-4 text-center font-display text-heading-lg text-foreground md:text-heading-xl"
        >
          {data.title}
        </h2>
        <div className="mt-5 h-px w-16 bg-accent" aria-hidden="true" />

        <ul className="mt-12 grid w-full max-w-[1140px] list-none grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="about-value-card flex flex-col items-start px-6 py-10 md:px-8 md:py-12"
            >
              <ValueIcon icon={item.icon} />
              <h3 className="mt-5 text-heading-sm text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-body-sm leading-relaxed text-secondary md:text-body-md">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
