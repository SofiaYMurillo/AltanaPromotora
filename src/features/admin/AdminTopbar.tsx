import { AdminNotificationCenter } from "./AdminNotificationCenter";

import { AdminProfileMenu } from "./AdminProfileMenu";

import type { AdminCurrentUser } from "./admin.types";

import type { AdminProfileView } from "./admin-profile.types";



type AdminTopbarProps = {

  currentUser: AdminCurrentUser;

  profile: AdminProfileView;

  notificationsCount: number;

};



export function AdminTopbar({

  currentUser,

  profile,

  notificationsCount,

}: AdminTopbarProps) {

  return (

    <header className="admin-topbar flex shrink-0 flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

      <div className="flex flex-col gap-1">

        <p className="text-caption uppercase tracking-[0.16em] text-on-primary-muted">

          ALTANA · Panel

        </p>

        <h1 className="text-heading-sm text-background">

          Panel Administrativo

        </h1>

        <p className="text-body-sm text-on-primary-muted">

          {currentUser.displayName}

          {currentUser.isPrincipalAdmin ? " · Administrador principal" : ""}

        </p>

      </div>



      <div className="flex flex-wrap items-center gap-3 sm:gap-4">

        <AdminProfileMenu initialProfile={profile} />



        <AdminNotificationCenter initialUnreadCount={notificationsCount} />

      </div>

    </header>

  );

}

