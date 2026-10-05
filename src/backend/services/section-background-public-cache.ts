import { revalidatePath } from "next/cache";

const PUBLIC_PATH_BY_PAGE_KEY: Record<string, string> = {
  home: "/",
  about: "/about",
  projects: "/projects",
  contact: "/contact",
};

export function revalidateSectionBackgroundPublic(pageKey: string) {
  const path = PUBLIC_PATH_BY_PAGE_KEY[pageKey];
  if (!path) {
    return;
  }

  try {
    revalidatePath(path);
  } catch {
    // revalidatePath only runs inside a Next.js request; ignore in scripts/tests.
  }
}
