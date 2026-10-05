import type { SiteSettings } from "@/types/site-settings";

import type { AdminProfileView } from "./admin-profile.types";

import type { AdminNavigation } from "./navigation/navigation.types";

export type AdminCurrentUser = {
  id: string;
  displayName: string;
  email: string;
  isPrincipalAdmin: boolean;
};

export type AdminShellData = {
  settings: SiteSettings;
  navigation: AdminNavigation;
  currentUser: AdminCurrentUser;
  profile: AdminProfileView;
  notificationsCount: number;
};
