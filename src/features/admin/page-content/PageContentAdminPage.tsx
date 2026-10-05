import Link from "next/link";

import { AdminCard, AdminPage } from "@/features/admin";
import type { MediaAsset } from "@/types/media";

import type { AboutTeamSectionContent } from "@/domain";

import { AboutTeamPanel } from "./AboutTeamPanel";
import { SectionBackgroundsPanel } from "./SectionBackgroundsPanel";
import { SiteIdentityPanel } from "./SiteIdentityPanel";
import type { AdminAboutTeamMemberView } from "./about-team-api.client";

type PageContentAdminPageProps = {
  logoMediaAssetId: string | null;
  initialLogo: MediaAsset | null;
  aboutTeamSection: AboutTeamSectionContent;
  aboutTeamMembers: AdminAboutTeamMemberView[];
};

export function PageContentAdminPage({
  logoMediaAssetId,
  initialLogo,
  aboutTeamSection,
  aboutTeamMembers,
}: PageContentAdminPageProps) {
  return (
    <AdminPage
      title="Contenido de la página"
      description="Identidad visual, fondos de header y contenido global del sitio. No administra proyectos inmobiliarios."
    >
      <div className="flex flex-col gap-8">
        <AdminCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-md text-foreground">Biblioteca Multimedia</p>
              <p className="mt-1 text-body-sm text-muted">
                Repositorio global de imágenes y videos reutilizables.
              </p>
            </div>
            <Link href="/admin/media" className="btn-primary">
              Abrir biblioteca
            </Link>
          </div>
        </AdminCard>

        <SiteIdentityPanel
          initialLogo={initialLogo}
          logoMediaAssetId={logoMediaAssetId}
        />

        <AboutTeamPanel
          initialSection={aboutTeamSection}
          initialMembers={aboutTeamMembers}
        />

        <SectionBackgroundsPanel
          variant="headers"
          title="Fondos de header"
          description="Hero de Home, Sobre Nosotros y headers editoriales. CMS con fallback a las fotografías actuales del sitio."
        />

        <SectionBackgroundsPanel
          variant="sections"
          title="Fondos de secciones"
          description="Bloques interiores y bandas visuales. Mismo sistema de tipos: imagen, video o color sólido."
        />
      </div>
    </AdminPage>
  );
}
