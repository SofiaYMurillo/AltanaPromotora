import type { Project, Property } from "@/domain";

export type AdminProjectView = Project;
export type AdminPropertyView = Property;

export type CatalogWriteResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string };
