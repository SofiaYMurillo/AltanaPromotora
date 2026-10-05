import type {
  AppointmentStatus,
  AppointmentVisitType,
  CalendarAppointment,
  CalendarDay,
  CalendarRange,
} from "@/domain";

export type { CalendarAppointment, CalendarDay, CalendarRange };

export type AdminCalendarFilters = {
  date: string;
  status?: AppointmentStatus;
  resourceType?: AppointmentVisitType;
};

export type AdminCalendarViewStatus = "ready" | "loading" | "error";

/** Chronological bucket used by the day view. */
export type CalendarHourGroup = {
  hour: string;
  appointments: CalendarAppointment[];
};
