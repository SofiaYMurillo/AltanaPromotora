import Link from "next/link";

import type { HeaderCta } from "@/types/navigation";

type HeaderCtaLinkProps = HeaderCta & {
  className?: string;
  onClick?: () => void;
};

export function HeaderCtaLink({
  label,
  href,
  className,
  onClick,
}: HeaderCtaLinkProps) {
  return (
    <Link
      href={href}
      className={`btn-primary ${className ?? ""}`}
      onClick={onClick}
      data-nav="header-agendar-visita"
    >
      {label}
    </Link>
  );
}
