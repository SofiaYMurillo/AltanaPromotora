export interface AdminNavigationItem {
  /** When set, workers need this permission (principal admin always sees the item). */
  requiredPermission?: string;
  id: string;
  label: string;
  href: string;
  /** Visible only when the current user is the principal admin. */
  requiresPrincipalAdmin?: boolean;
}

export interface AdminNavigationSection {
  id: string;
  label?: string;
  items: AdminNavigationItem[];
}

export interface AdminNavigation {
  sections: AdminNavigationSection[];
}
