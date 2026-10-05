import {
  calendarToday,
  getAdminCalendar,
} from "@/backend/services/calendar-service";
import { adminPagePermissions, requireAdminPage } from "@/features/admin/server";
import { CalendarAdminPage } from "@/frontend/features/admin-calendar";

export default async function CalendarRoute() {
  const access = await requireAdminPage({
    requirement: {
      type: "permission",
      permission: adminPagePermissions.appointments,
    },
  });
  if (!access.allowed) {
    return access.element;
  }

  const today = calendarToday();
  const result = await getAdminCalendar({ date: today });

  return (
    <CalendarAdminPage
      today={today}
      initialDate={today}
      initialAppointments={result.ok ? result.days[0]?.appointments ?? [] : []}
    />
  );
}
