import { officeLocations } from "@/config/office-locations.data";
import { PublicPage } from "@/features/public";
import { AppointmentsPage } from "@/features/public/appointments";

export default function AppointmentsRoute() {
  return (
    <PublicPage
      title="Agenda tu visita"
      description="Elige cómo quieres conocer ALTANA. Puedes visitarnos en nuestra oficina o explorar nuestros inmuebles disponibles."
    >
      <AppointmentsPage offices={officeLocations} />
    </PublicPage>
  );
}
