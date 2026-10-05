import {
  ALTANA_PROFILE_LOGO_MEDIA_ID,
  ALTANA_PUBLIC_LOGO_MEDIA_ID,
  altanaBrandAssets,
} from "../src/config/brand-assets.data";
import type { PrismaClient } from "../src/generated/prisma/client";

const BRAND_SEED_DATE = new Date("2026-09-24T00:00:00.000Z");

export async function seedBrandMediaAssets(prisma: PrismaClient) {
  const publicLogo = altanaBrandAssets.publicLogo;
  const profileLogo = altanaBrandAssets.profileLogo;

  await prisma.mediaAsset.upsert({
    where: { id: ALTANA_PUBLIC_LOGO_MEDIA_ID },
    create: {
      id: ALTANA_PUBLIC_LOGO_MEDIA_ID,
      fileName: "logo-altana-public.png",
      originalName: publicLogo.originalName,
      mimeType: publicLogo.mimeType,
      kind: "image",
      url: publicLogo.src,
      alt: publicLogo.alt,
      width: 1024,
      height: 769,
      size: 170668,
      createdAt: BRAND_SEED_DATE,
      updatedAt: BRAND_SEED_DATE,
    },
    update: {
      fileName: "logo-altana-public.png",
      originalName: publicLogo.originalName,
      mimeType: publicLogo.mimeType,
      kind: "image",
      url: publicLogo.src,
      alt: publicLogo.alt,
      updatedAt: new Date(),
    },
  });

  await prisma.mediaAsset.upsert({
    where: { id: ALTANA_PROFILE_LOGO_MEDIA_ID },
    create: {
      id: ALTANA_PROFILE_LOGO_MEDIA_ID,
      fileName: "logo-altana-profile.jpg",
      originalName: profileLogo.originalName,
      mimeType: profileLogo.mimeType,
      kind: "image",
      url: profileLogo.src,
      alt: profileLogo.alt,
      width: 800,
      height: 800,
      size: 79710,
      createdAt: BRAND_SEED_DATE,
      updatedAt: BRAND_SEED_DATE,
    },
    update: {
      fileName: "logo-altana-profile.jpg",
      originalName: profileLogo.originalName,
      mimeType: profileLogo.mimeType,
      kind: "image",
      url: profileLogo.src,
      alt: profileLogo.alt,
      updatedAt: new Date(),
    },
  });

  const site = await prisma.siteConfiguration.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      logoMediaAssetId: ALTANA_PUBLIC_LOGO_MEDIA_ID,
      contactJson: "{}",
    },
    update: {},
  });

  if (!site.logoMediaAssetId) {
    await prisma.siteConfiguration.update({
      where: { id: "default" },
      data: { logoMediaAssetId: ALTANA_PUBLIC_LOGO_MEDIA_ID },
    });
  }
}
