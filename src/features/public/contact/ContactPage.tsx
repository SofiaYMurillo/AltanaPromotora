import { ContactRequestForm } from "@/frontend/features/contact-requests";
import { SectionBackgroundMedia } from "@/frontend/components/common/SectionBackgroundMedia";
import { SocialMediaLinks } from "@/frontend/components/social/SocialMediaLinks";

import type { ContactDirectInfo, ContactPageData } from "./contact.types";

type ContactPageProps = {
  data: ContactPageData;
  direct: ContactDirectInfo;
  instagramUrl?: string | null;
};

export function ContactPage({ data, direct, instagramUrl }: ContactPageProps) {
  const heroBackground = data.hero.cmsBackground ?? { type: "none" as const };

  return (
    <main className="flex flex-col">
      <section
        aria-labelledby="contact-hero-heading"
        className="relative isolate overflow-hidden px-6 py-20 md:px-10 md:py-28 lg:py-32"
      >
        <div className="absolute inset-0">
          <SectionBackgroundMedia background={heroBackground} sizes="100vw" />
          {heroBackground.type === "none" ? (
            <div className="absolute inset-0 bg-primary" aria-hidden="true" />
          ) : null}
        </div>
        {(heroBackground.type === "none" ||
          heroBackground.type === "image" ||
          heroBackground.type === "video") && (
          <div
            className="absolute inset-0 bg-[rgb(25_28_33/0.55)]"
            aria-hidden="true"
          />
        )}
        <div className="container relative">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="section-eyebrow text-accent">{data.hero.eyebrow}</p>
              <h1
                id="contact-hero-heading"
                className="mt-6 font-display text-[clamp(2.25rem,1.2rem+3.5vw,3.75rem)] font-normal uppercase leading-[1.05] text-background"
              >
                {data.hero.titleLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              <div className="mt-8 h-0.5 w-20 bg-accent" aria-hidden="true" />
              <p className="mt-8 max-w-xl text-body-md font-light text-on-primary-muted md:text-body-lg">
                {data.hero.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="contact-talk-heading"
        className="bg-surface px-6 py-16 md:px-10 md:py-24"
      >
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <aside className="flex flex-col lg:col-span-4">
              <h2
                id="contact-talk-heading"
                className="font-display text-heading-lg text-foreground md:text-heading-xl"
              >
                {data.talk.title}
              </h2>
              <div className="accent-rule-sm mt-5" aria-hidden="true" />
              <p className="mt-6 text-body-md text-secondary">{data.talk.lead}</p>

              <div className="mt-12 border-t border-border/70 pt-10">
                <h3 className="text-caption uppercase tracking-[0.18em] text-accent">
                  {data.directContact.title}
                </h3>
                <ul className="mt-6 flex flex-col gap-5 text-body-sm text-foreground">
                  {direct.phones.map((phone) => (
                    <li key={phone}>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="contact-direct-link"
                      >
                        {phone}
                      </a>
                    </li>
                  ))}
                  {direct.emails.map((email) => (
                    <li key={email}>
                      <a href={`mailto:${email}`} className="contact-direct-link">
                        {email}
                      </a>
                    </li>
                  ))}
                  {direct.address ? (
                    <li className="text-secondary">{direct.address}</li>
                  ) : null}
                </ul>
                <div className="mt-8">
                  <SocialMediaLinks instagramUrl={instagramUrl} />
                </div>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <div className="catalog-editorial-panel h-full">
                <ContactRequestForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
