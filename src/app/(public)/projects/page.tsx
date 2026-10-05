import { resolveSectionBackground } from "@/backend/services/public-section-background-service";
import { listPublicProjects } from "@/backend/services/project-service";
import { listPublicProperties } from "@/backend/services/property-service";
import {
  toPublicProjectView,
  toPublicPropertyView,
} from "@/backend/mappers/catalog-public-mapper";
import { ProjectsPage } from "@/features/public/projects";
import { projectsPageEditorial } from "@/features/public/projects/projects.page.data";

export const dynamic = "force-dynamic";

export default async function ProjectsRoute() {
  const [projects, properties, headerCmsBackground] = await Promise.all([
    listPublicProjects(),
    listPublicProperties(),
    resolveSectionBackground("projects", "header"),
  ]);

  return (
    <ProjectsPage
      data={{
        projects: projects.map(toPublicProjectView),
        properties: properties.map(toPublicPropertyView),
        editorial: projectsPageEditorial,
        headerCmsBackground,
      }}
    />
  );
}
