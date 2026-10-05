import path from "node:path";

/**
 * Resolves relative SQLite file URLs against the process cwd so admin API and
 * public routes always share the same database file in development.
 */
export function resolveDatabaseUrl(raw: string): string {
  if (!raw.startsWith("file:")) {
    return raw;
  }

  const filePath = raw.slice("file:".length);
  if (path.isAbsolute(filePath)) {
    return raw;
  }

  return `file:${path.join(process.cwd(), filePath)}`;
}
