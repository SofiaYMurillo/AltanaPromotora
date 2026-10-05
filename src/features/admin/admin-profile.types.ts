export type AdminProfileAvatar = {
  url: string;
  alt: string;
  profileMediaAssetId: string | null;
  isCustom: boolean;
};

export type AdminProfileView = {
  displayName: string;
  email: string;
  isPrincipalAdmin: boolean;
  avatar: AdminProfileAvatar;
};
