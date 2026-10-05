import { revalidatePath } from "next/cache";

import * as propertyRepository from "../repositories/property-repository";

/**
 * Invalidates public catalog routes after admin mutations.
 * Must run only on the server after a successful write.
 */
export async function revalidatePublicCatalog(options?: {
  propertyId?: string;
  projectId?: string;
}) {
  try {
    revalidatePath("/projects");

    if (options?.propertyId) {
      revalidatePath(`/projects/${options.propertyId}`);
    }

    if (options?.projectId) {
      const properties = await propertyRepository.listProperties({
        projectId: options.projectId,
      });
      for (const property of properties) {
        revalidatePath(`/projects/${property.id}`);
      }
    }
  } catch {
    // revalidatePath requires a Next.js request context; ignore in scripts/tests.
  }
}
