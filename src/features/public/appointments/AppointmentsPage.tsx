"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OfficeLocation } from "@/domain";
import { AppointmentBooking } from "@/frontend/features/appointments/AppointmentBooking";
import { publicPaths } from "@/frontend/config/site";

import { AppointmentTypeSelector } from "./AppointmentTypeSelector";

type AppointmentsPageProps = {
  offices: OfficeLocation[];
};

type AppointmentsStep = "choose" | "office";

export function AppointmentsPage({ offices }: AppointmentsPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<AppointmentsStep>("choose");

  if (step === "office") {
    return (
      <div className="max-w-2xl">
        <AppointmentBooking
          offices={offices}
          presentation="embedded"
          allowedVisitTypes={["office"]}
          defaultVisitType="office"
          sectionId="agendar-oficina"
          formTitle="Visita a oficina"
          formLead="Selecciona una fecha y horario disponible para reunirte con nuestro equipo."
          onDismiss={() => setStep("choose")}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-2xl text-body-md text-secondary">
        ¿Qué tipo de visita deseas?
      </p>
      <AppointmentTypeSelector
        onChooseOffice={() => setStep("office")}
        onChooseProperty={() => router.push(publicPaths.projects)}
      />
    </div>
  );
}
