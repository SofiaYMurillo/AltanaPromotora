import type { ReactNode } from "react";

import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import type { AdminShellData } from "./admin.types";

type AdminShellProps = {
  data: AdminShellData;
  children: ReactNode;
};

export function AdminShell({ data, children }: AdminShellProps) {
  return (
    <div
      aria-label="Panel administrativo"
      className="admin-shell flex min-h-screen flex-col bg-background lg:flex-row"
    >
      <AdminSidebar navigation={data.navigation} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar
          currentUser={data.currentUser}
          profile={data.profile}
          notificationsCount={data.notificationsCount}
        />
        <main className="admin-shell-main flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
