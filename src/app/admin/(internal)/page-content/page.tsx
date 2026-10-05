import { getAdminAboutTeamBundle } from "@/backend/services/about-team-service";
import { getAdminSiteConfiguration } from "@/backend/services/site-settings-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { PageContentAdminPage } from "@/features/admin/page-content";

export default async function PageContentRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.pageContent,
    },
    deniedDescription: "No tienes permiso para editar el contenido de la página.",
  });
  if (!access.allowed) {
    return access.element;
  }

  const [siteConfig, aboutTeam] = await Promise.all([
    getAdminSiteConfiguration(),
    getAdminAboutTeamBundle(),
  ]);
  const logoAsset = siteConfig.logoAsset;

  return (
    <PageContentAdminPage
      aboutTeamSection={aboutTeam.section}
      aboutTeamMembers={aboutTeam.members}
      logoMediaAssetId={siteConfig.logoMediaAssetId}
      initialLogo={
        logoAsset
          ? {
              id: logoAsset.id,
              url: logoAsset.url,
              alt: logoAsset.alt,
              width: logoAsset.width ?? 0,
              height: logoAsset.height ?? 0,
              mimeType: logoAsset.mimeType,
              size: logoAsset.size,
              createdAt: logoAsset.createdAt,
              updatedAt: logoAsset.updatedAt,
            }
          : null
      }
    />
  );
}
