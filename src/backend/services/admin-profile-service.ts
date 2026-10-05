import { altanaBrandAssets } from "@/config/brand-assets.data";
import type {
  AdminProfileAvatar,
  AdminProfileView,
} from "@/features/admin/admin-profile.types";
import type { User } from "@/types/user";

import * as mediaRepository from "../repositories/media-repository";
import * as userRepository from "../repositories/user-repository";

export type { AdminProfileAvatar, AdminProfileView };

function fallbackAvatar(): AdminProfileAvatar {
  return {
    url: altanaBrandAssets.profileLogo.src,
    alt: altanaBrandAssets.profileLogo.alt,
    profileMediaAssetId: null,
    isCustom: false,
  };
}

export async function resolveAdminProfileAvatar(
  user: Pick<User, "profileMediaAssetId">,
): Promise<AdminProfileAvatar> {
  if (!user.profileMediaAssetId) {
    return fallbackAvatar();
  }

  const asset = await mediaRepository.getMediaAssetById(user.profileMediaAssetId);
  if (!asset || asset.kind !== "image") {
    return fallbackAvatar();
  }

  return {
    url: asset.url,
    alt: asset.alt || altanaBrandAssets.profileLogo.alt,
    profileMediaAssetId: asset.id,
    isCustom: true,
  };
}

export async function getAdminProfileView(input: {
  user: User;
  isPrincipalAdmin: boolean;
}): Promise<AdminProfileView> {
  const displayName =
    `${input.user.firstName} ${input.user.lastName}`.trim() || input.user.email;

  return {
    displayName,
    email: input.user.email,
    isPrincipalAdmin: input.isPrincipalAdmin,
    avatar: await resolveAdminProfileAvatar(input.user),
  };
}

export async function updateCurrentUserProfileAvatar(
  userId: string,
  profileMediaAssetId: string | null,
  isPrincipalAdmin: boolean,
) {
  if (profileMediaAssetId) {
    const asset = await mediaRepository.getMediaAssetById(profileMediaAssetId);
    if (!asset || asset.kind !== "image") {
      return { ok: false as const, error: "invalid_avatar" as const };
    }
  }

  const updated = await userRepository.updateUserProfileMediaAsset(
    userId,
    profileMediaAssetId,
  );

  return {
    ok: true as const,
    profile: await getAdminProfileView({
      user: updated,
      isPrincipalAdmin,
    }),
  };
}
