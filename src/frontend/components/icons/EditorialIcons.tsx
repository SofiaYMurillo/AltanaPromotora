type IconProps = {
  className?: string;
  title?: string;
};

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function IconDesign({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

export function IconQuality({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <path d="M12 3 4.5 7v5.5c0 5 3.4 7.7 7.5 8.5 4.1-.8 7.5-3.5 7.5-8.5V7L12 3Z" />
      <path d="m8.5 12 2.4 2.4 4.6-5" />
    </svg>
  );
}

export function IconLocation({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

export function IconFamilies({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <circle cx="9" cy="8" r="2.2" />
      <circle cx="16" cy="9" r="1.8" />
      <path d="M4.5 18.5c.4-3 2.4-4.7 4.5-4.7s4.1 1.7 4.5 4.7" />
      <path d="M13 18.5c.3-2.2 1.6-3.5 3-3.5 1.5 0 2.8 1.3 3.2 3.5" />
    </svg>
  );
}

export function IconProjects({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function IconYears({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.2L15 15" />
    </svg>
  );
}

export function IconSatisfaction({ className, title }: IconProps) {
  return (
    <svg {...svgProps} className={className}>
      {title ? <title>{title}</title> : null}
      <path d="m12 4 1.8 4.6L19 9.2l-3.6 3.2.9 4.8L12 15.2 7.7 17.2l.9-4.8L5 9.2l5.2-.6Z" />
    </svg>
  );
}

export const aboutAttributeIcons = {
  design: IconDesign,
  quality: IconQuality,
  location: IconLocation,
} as const;

export const statIcons = {
  families: IconFamilies,
  projects: IconProjects,
  years: IconYears,
  satisfaction: IconSatisfaction,
} as const;

export type AboutAttributeIconName = keyof typeof aboutAttributeIcons;
export type StatIconName = keyof typeof statIcons;
