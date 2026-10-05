/** Responsive grid tuned for 1–N published members (editorial, not fixed columns). */
export function teamSectionGridClass(memberCount: number): string {
  const base =
    "mt-16 list-none grid grid-cols-1 gap-12 sm:gap-10 lg:mt-20 lg:gap-14";

  if (memberCount <= 0) {
    return base;
  }

  if (memberCount === 1) {
    return `${base} mx-auto max-w-[min(100%,22rem)]`;
  }

  if (memberCount === 2) {
    return `${base} mx-auto max-w-4xl sm:grid-cols-2`;
  }

  if (memberCount === 3) {
    return `${base} lg:grid-cols-3`;
  }

  if (memberCount === 4) {
    return `${base} sm:grid-cols-2 xl:max-w-6xl xl:grid-cols-4 xl:mx-auto`;
  }

  return `${base} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
}
