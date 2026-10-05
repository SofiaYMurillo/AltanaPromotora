const TOKEN_CLASS: Record<string, string> = {
  primary: "bg-primary",
  surface: "bg-surface",
  background: "bg-background",
  accent: "bg-accent",
  secondary: "bg-secondary",
  carbon: "bg-primary",
  hueso: "bg-background",
};

export function sectionBackgroundSurfaceClass(token: string | undefined) {
  if (!token) {
    return "bg-primary";
  }
  return TOKEN_CLASS[token] ?? "bg-primary";
}
