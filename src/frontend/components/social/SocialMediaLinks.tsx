const FACEBOOK_URL = "https://www.facebook.com/share/1BwJjoMk1k/";
const TIKTOK_URL =
  "https://www.tiktok.com/@altana.promotora?_r=1&_t=ZS-9A6zoQcGvtm";

const linkClassName =
  "inline-flex w-fit text-accent transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

type SocialMediaLinksProps = {
  instagramUrl?: string | null;
  className?: string;
};

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm5.75-1.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5 3H16V0h-2.5C9.91 0 7 2.91 7 6.5V9H4v3h3v12h3V12h3.3l.7-3H10V6.7C10 5.2 10.2 3 13.5 3Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.5 3.5c1.1.8 2.4 1.3 3.8 1.4V8.2c-1.3 0-2.5-.4-3.5-1v7.8c0 3.4-2.8 6.2-6.2 6.2S4.4 18.4 4.4 15s2.8-6.2 6.2-6.2c.3 0 .7 0 1 .1v3.4c-.3-.1-.6-.2-1-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 2.9 2.9 2.9 2.9-1.3 2.9-2.9V3.5h3.1Z" />
    </svg>
  );
}

export function SocialMediaLinks({
  instagramUrl,
  className = "flex flex-wrap items-center gap-4",
}: SocialMediaLinksProps) {
  const showInstagram = Boolean(instagramUrl?.trim());

  if (!showInstagram) {
    return (
      <div className={className}>
        <a
          href={FACEBOOK_URL}
          className={linkClassName}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="sr-only">Facebook</span>
          <FacebookIcon />
        </a>
        <a
          href={TIKTOK_URL}
          className={linkClassName}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="sr-only">TikTok</span>
          <TikTokIcon />
        </a>
      </div>
    );
  }

  return (
    <div className={className}>
      <a
        href={instagramUrl!}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="sr-only">Instagram</span>
        <InstagramIcon />
      </a>
      <a
        href={FACEBOOK_URL}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="sr-only">Facebook</span>
        <FacebookIcon />
      </a>
      <a
        href={TIKTOK_URL}
        className={linkClassName}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="sr-only">TikTok</span>
        <TikTokIcon />
      </a>
    </div>
  );
}
