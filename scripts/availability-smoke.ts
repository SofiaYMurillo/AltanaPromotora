import "dotenv/config";

import {
  addCalendarDays,
  generateSlotStarts,
  generateSlotsForDay,
  remainingSlotCapacity,
  validateAvailabilitySchedule,
  weekdayFromDateKey,
} from "../src/domain";
import { prisma } from "../src/backend/db";
import * as availabilityRepository from "../src/backend/repositories/availability-repository";
import {
  createPublicAppointment,
  updateAppointmentStatus,
} from "../src/backend/services/appointment-service";
import {
  getPublicAvailability,
  resolveBookableSlot,
} from "../src/backend/services/availability-service";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function firstWeekdayOnOrAfter(dateKey: string, day: number) {
  let current = dateKey;
  for (let offset = 0; offset < 7; offset += 1) {
    if (weekdayFromDateKey(current) === day) {
      return current;
    }
    current = addCalendarDays(current, 1);
  }
  throw new Error(`weekday ${day} not found from ${dateKey}`);
}

async function upsertRule(input: {
  id: string;
  resourceType: "property" | "office";
  resourceId: string;
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  interval: number;
  slotCapacity: number;
}) {
  await availabilityRepository.upsertAvailabilityRule({
    ...input,
    active: true,
  });
}

async function main() {
  const hourSlots = generateSlotStarts({
    day: 1,
    startTime: "09:00",
    endTime: "13:00",
    interval: 60,
  });
  assert(
    hourSlots.join(",") === "09:00,10:00,11:00,12:00",
    "A. 09:00–13:00 / 60 excludes endTime",
  );

  const halfHourSlots = generateSlotStarts({
    day: 1,
    startTime: "09:00",
    endTime: "12:00",
    interval: 30,
  });
  assert(
    halfHourSlots.join(",") === "09:00,09:30,10:00,10:30,11:00,11:30",
    "B. 09:00–12:00 / 30",
  );

  assert(
    validateAvailabilitySchedule({
      day: 7,
      startTime: "09:00",
      endTime: "13:00",
      interval: 60,
      slotCapacity: 1,
    }).ok === false,
    "C. invalid dayOfWeek",
  );

  assert(
    validateAvailabilitySchedule({
      day: 1,
      startTime: "13:00",
      endTime: "09:00",
      interval: 60,
      slotCapacity: 1,
    }).ok === false,
    "D. endTime before startTime",
  );
  assert(
    validateAvailabilitySchedule({
      day: 1,
      startTime: "09:00",
      endTime: "09:00",
      interval: 60,
      slotCapacity: 1,
    }).ok === false,
    "D. endTime equal to startTime",
  );

  assert(
    validateAvailabilitySchedule({
      day: 1,
      startTime: "09:00",
      endTime: "13:00",
      interval: 0,
      slotCapacity: 1,
    }).ok === false,
    "E. intervalMinutes invalid",
  );

  assert(
    validateAvailabilitySchedule({
      day: 1,
      startTime: "09:00",
      endTime: "13:00",
      interval: 60,
      slotCapacity: 0,
      requireCapacity: true,
    }).ok === false,
    "F. slotCapacity invalid",
  );

  assert(
    generateSlotsForDay(
      [{ day: 2, startTime: "09:00", endTime: "12:00", interval: 30 }],
      1,
    ).length === 0,
    "G. day without rules produces no slots",
  );

  assert(remainingSlotCapacity(1, 1) === 0, "O. remaining is zero when full");
  assert(remainingSlotCapacity(2, 1) === 1, "P. remaining is one when partial");

  const stamp = Date.now();
  const propertyId = `availability-smoke-p-${stamp}`;
  const lockId = `availability-smoke-lock-${stamp}`;
  const cap2Id = `availability-smoke-p-${stamp}-cap2`;
  const inactivePropertyId = `availability-smoke-inactive-${stamp}`;
  const monday = firstWeekdayOnOrAfter("2099-06-01", 1);
  const tuesday = firstWeekdayOnOrAfter("2099-06-01", 2);
  const createdAppointmentIds: string[] = [];
  const createdPropertyIds = [propertyId, lockId, cap2Id, inactivePropertyId];

  // Visit resources must be known Properties (SQLite) before availability applies.
  for (const id of [propertyId, lockId, cap2Id]) {
    await prisma.property.create({
      data: {
        id,
        title: `Disponibilidad ${id}`,
        operation: "sale",
        type: "apartment",
        city: "Pereira",
        bedrooms: 2,
        bathrooms: 1,
        area: 70,
        parkingSpaces: 1,
        price: 100000000,
        featuresJson: "[]",
        imagesJson: JSON.stringify([
          { src: "/images/projects-placeholder.jpg", alt: "Smoke" },
        ]),
        active: true,
        updatedAt: new Date(),
      },
    });
  }
  await prisma.property.create({
    data: {
      id: inactivePropertyId,
      title: `Inactivo ${inactivePropertyId}`,
      operation: "sale",
      type: "apartment",
      city: "Pereira",
      bedrooms: 2,
      bathrooms: 1,
      area: 70,
      parkingSpaces: 1,
      price: 100000000,
      featuresJson: "[]",
      imagesJson: JSON.stringify([
        { src: "/images/projects-placeholder.jpg", alt: "Smoke" },
      ]),
      active: false,
      updatedAt: new Date(),
    },
  });

  await upsertRule({
    id: `availability-smoke-p-${stamp}-1-0900`,
    resourceType: "property",
    resourceId: propertyId,
    day: 1,
    startTime: "09:00",
    endTime: "11:00",
    interval: 60,
    slotCapacity: 1,
  });
  await upsertRule({
    id: `availability-smoke-lock-${stamp}-1-0900`,
    resourceType: "property",
    resourceId: lockId,
    day: 1,
    startTime: "09:00",
    endTime: "10:00",
    interval: 60,
    slotCapacity: 1,
  });
  await upsertRule({
    id: `availability-smoke-cap2-${stamp}-1-0900`,
    resourceType: "property",
    resourceId: cap2Id,
    day: 1,
    startTime: "09:00",
    endTime: "11:00",
    interval: 60,
    slotCapacity: 2,
  });
  await upsertRule({
    id: `availability-smoke-inactive-${stamp}-1-0900`,
    resourceType: "property",
    resourceId: inactivePropertyId,
    day: 1,
    startTime: "09:00",
    endTime: "11:00",
    interval: 60,
    slotCapacity: 1,
  });

  const emptyMonday = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: tuesday,
  });
  assert(emptyMonday.ok, "query for a configured resource succeeds");
  if (emptyMonday.ok) {
    assert(
      emptyMonday.days[0]?.slots.length === 0,
      "G. weekday without rules has no slots",
    );
  }

  const pending = await createPublicAppointment({
    id: `availability-smoke-${stamp}-pending`,
    type: "property",
    propertyId,
    date: monday,
    time: "09:00",
    communicationPreference: "none",
  });
  assert(pending.ok, "H. pending booking succeeds");
  if (!pending.ok) {
    throw new Error("pending booking failed");
  }
  createdAppointmentIds.push(pending.appointment.id);

  const afterPending = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: monday,
  });
  assert(afterPending.ok, "availability after pending");
  if (afterPending.ok) {
    const slot = afterPending.days[0]?.slots.find((item) => item.startTime === "09:00");
    assert(slot && !slot.available && slot.remainingCapacity === 0, "H. pending occupies");
    const later = afterPending.days[0]?.slots.find((item) => item.startTime === "10:00");
    assert(later?.available, "other slot stays free");
  }

  const confirmed = await updateAppointmentStatus(pending.appointment.id, "confirmed");
  assert(confirmed.ok, "confirm pending");
  const afterConfirmed = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: monday,
  });
  if (afterConfirmed.ok) {
    const slot = afterConfirmed.days[0]?.slots.find((item) => item.startTime === "09:00");
    assert(slot && !slot.available, "I. confirmed occupies");
  }

  const completed = await updateAppointmentStatus(pending.appointment.id, "completed");
  assert(completed.ok, "complete confirmed");
  const afterCompleted = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: monday,
  });
  if (afterCompleted.ok) {
    const slot = afterCompleted.days[0]?.slots.find((item) => item.startTime === "09:00");
    assert(slot?.available && slot.remainingCapacity === 1, "K. completed releases");
  }

  const cancelledBooking = await createPublicAppointment({
    id: `availability-smoke-${stamp}-cancelled`,
    type: "property",
    propertyId,
    date: monday,
    time: "09:00",
    communicationPreference: "none",
  });
  assert(cancelledBooking.ok, "J. rebook after release");
  if (!cancelledBooking.ok) {
    throw new Error("cancelled booking create failed");
  }
  createdAppointmentIds.push(cancelledBooking.appointment.id);
  const cancelled = await updateAppointmentStatus(
    cancelledBooking.appointment.id,
    "cancelled",
  );
  assert(cancelled.ok, "cancel pending");
  const afterCancelled = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: monday,
  });
  if (afterCancelled.ok) {
    const slot = afterCancelled.days[0]?.slots.find((item) => item.startTime === "09:00");
    assert(slot?.available, "J. cancelled releases");
  }

  const noShowBooking = await createPublicAppointment({
    id: `availability-smoke-${stamp}-noshow`,
    type: "property",
    propertyId,
    date: monday,
    time: "09:00",
    communicationPreference: "none",
  });
  assert(noShowBooking.ok, "L. book for no_show path");
  if (!noShowBooking.ok) {
    throw new Error("no_show booking create failed");
  }
  createdAppointmentIds.push(noShowBooking.appointment.id);
  assert(
    (await updateAppointmentStatus(noShowBooking.appointment.id, "confirmed")).ok,
    "confirm for no_show",
  );
  assert(
    (await updateAppointmentStatus(noShowBooking.appointment.id, "no_show")).ok,
    "mark no_show",
  );
  const afterNoShow = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: monday,
  });
  if (afterNoShow.ok) {
    const slot = afterNoShow.days[0]?.slots.find((item) => item.startTime === "09:00");
    assert(slot?.available, "L. no_show releases");
  }

  const capacityOne = await createPublicAppointment({
    id: `availability-smoke-${stamp}-cap1`,
    type: "property",
    propertyId,
    date: monday,
    time: "10:00",
    communicationPreference: "none",
  });
  assert(capacityOne.ok, "M. capacity 1 first booking");
  if (capacityOne.ok) {
    createdAppointmentIds.push(capacityOne.appointment.id);
  }
  const capacityOneBlocked = await createPublicAppointment({
    id: `availability-smoke-${stamp}-cap1-blocked`,
    type: "property",
    propertyId,
    date: monday,
    time: "10:00",
    communicationPreference: "none",
  });
  assert(
    !capacityOneBlocked.ok && capacityOneBlocked.error === "slot_unavailable",
    "M/O/V. capacity 1 rejects the second booking",
  );

  const cap2First = await createPublicAppointment({
    id: `availability-smoke-${stamp}-cap2-a`,
    type: "property",
    propertyId: cap2Id,
    date: monday,
    time: "09:00",
    communicationPreference: "none",
  });
  const cap2Second = await createPublicAppointment({
    id: `availability-smoke-${stamp}-cap2-b`,
    type: "property",
    propertyId: cap2Id,
    date: monday,
    time: "09:00",
    communicationPreference: "none",
  });
  assert(cap2First.ok && cap2Second.ok, "N. capacity 2 accepts two bookings");
  if (cap2First.ok) {
    createdAppointmentIds.push(cap2First.appointment.id);
  }
  if (cap2Second.ok) {
    createdAppointmentIds.push(cap2Second.appointment.id);
  }
  const cap2Partial = await getPublicAvailability({
    resourceType: "property",
    resourceId: cap2Id,
    date: monday,
  });
  if (cap2Partial.ok) {
    const ten = cap2Partial.days[0]?.slots.find((item) => item.startTime === "10:00");
    assert(ten?.available && ten.remainingCapacity === 2, "P. unused slot keeps full capacity");
    const nine = cap2Partial.days[0]?.slots.find((item) => item.startTime === "09:00");
    assert(nine && !nine.available && nine.remainingCapacity === 0, "O. capacity 2 fills");
  }
  const cap2Third = await createPublicAppointment({
    id: `availability-smoke-${stamp}-cap2-c`,
    type: "property",
    propertyId: cap2Id,
    date: monday,
    time: "09:00",
    communicationPreference: "none",
  });
  assert(!cap2Third.ok && cap2Third.error === "slot_unavailable", "N. third booking rejected");

  const catalogProperty = await getPublicAvailability({
    resourceType: "property",
    resourceId: "property-001",
    date: tuesday,
  });
  assert(catalogProperty.ok, "Q. catalog property availability");
  if (catalogProperty.ok) {
    assert(
      catalogProperty.days[0]?.slots.some((slot) => slot.startTime === "09:00"),
      "Q. property-001 Tuesday slots exist",
    );
  }

  const catalogOffice = await getPublicAvailability({
    resourceType: "office",
    resourceId: "office-colibri",
    date: monday,
  });
  assert(catalogOffice.ok, "R. catalog office availability");
  if (catalogOffice.ok) {
    assert(
      catalogOffice.days[0]?.slots.some((slot) => slot.startTime === "08:00"),
      "R. office-colibri Monday slots exist",
    );
  }

  const officeBooking = await createPublicAppointment({
    id: `availability-smoke-${stamp}-office`,
    type: "office",
    officeLocationId: "office-colibri",
    date: monday,
    time: "08:00",
    communicationPreference: "none",
  });
  assert(officeBooking.ok, "R. office booking succeeds");
  if (officeBooking.ok) {
    createdAppointmentIds.push(officeBooking.appointment.id);
  }

  const missing = await getPublicAvailability({
    resourceType: "property",
    resourceId: `availability-missing-${stamp}`,
    date: monday,
  });
  assert(!missing.ok && missing.error === "invalid_resource", "S. unknown resource");

  const inactive = await getPublicAvailability({
    resourceType: "office",
    resourceId: "office-pereira-inactive",
    date: monday,
  });
  assert(!inactive.ok && inactive.error === "invalid_resource", "S. inactive office");

  const inactiveProperty = await getPublicAvailability({
    resourceType: "property",
    resourceId: inactivePropertyId,
    date: monday,
  });
  assert(
    !inactiveProperty.ok && inactiveProperty.error === "invalid_resource",
    "S. inactive persisted property cannot be booked",
  );

  const past = await getPublicAvailability({
    resourceType: "property",
    resourceId: propertyId,
    date: "2020-01-15",
  });
  assert(!past.ok && past.error === "invalid_date", "T. past date query");

  const pastBooking = await createPublicAppointment({
    id: `availability-smoke-${stamp}-past`,
    type: "property",
    propertyId,
    date: "2020-01-15",
    time: "09:00",
    communicationPreference: "none",
  });
  assert(!pastBooking.ok && pastBooking.error === "invalid_date", "T. past date booking");

  const invalidTime = await resolveBookableSlot({
    resourceType: "property",
    resourceId: propertyId,
    date: monday,
    time: "07:00",
  });
  assert(!invalidTime.ok && invalidTime.error === "invalid_time", "invalid configured time");

  const [firstConcurrent, secondConcurrent] = await Promise.all([
    createPublicAppointment({
      id: `availability-smoke-${stamp}-conc-a`,
      type: "property",
      propertyId: lockId,
      date: monday,
      time: "09:00",
      communicationPreference: "none",
    }),
    createPublicAppointment({
      id: `availability-smoke-${stamp}-conc-b`,
      type: "property",
      propertyId: lockId,
      date: monday,
      time: "09:00",
      communicationPreference: "none",
    }),
  ]);

  const concurrentResults = [firstConcurrent, secondConcurrent];
  const accepted = concurrentResults.filter((item) => item.ok);
  const rejected = concurrentResults.filter((item) => !item.ok);
  for (const item of accepted) {
    if (item.ok) {
      createdAppointmentIds.push(item.appointment.id);
    }
  }

  assert(accepted.length === 1, "W. only one concurrent booking is accepted");
  assert(
    rejected.length === 1 &&
      rejected[0] &&
      !rejected[0].ok &&
      rejected[0].error === "slot_unavailable",
    "W. the other concurrent booking is controlled",
  );

  const occupying = await prisma.appointment.count({
    where: {
      type: "property",
      propertyId: lockId,
      date: monday,
      time: "09:00",
      status: { in: ["pending", "confirmed"] },
    },
  });
  assert(occupying === 1, "W. only one occupying appointment remains");

  const noCapacityFromClient = await createPublicAppointment({
    id: `availability-smoke-${stamp}-forged-capacity`,
    type: "property",
    propertyId,
    date: monday,
    time: "10:00",
    communicationPreference: "none",
    ...({ slotCapacity: 99 } as object),
  } as Parameters<typeof createPublicAppointment>[0]);
  assert(
    !noCapacityFromClient.ok && noCapacityFromClient.error === "slot_unavailable",
    "public slotCapacity cannot raise capacity",
  );

  await prisma.appointment.deleteMany({
    where: { id: { in: createdAppointmentIds } },
  });
  await availabilityRepository.deleteAvailabilityRulesByResource("property", propertyId);
  await availabilityRepository.deleteAvailabilityRulesByResource("property", lockId);
  await availabilityRepository.deleteAvailabilityRulesByResource("property", cap2Id);
  await availabilityRepository.deleteAvailabilityRulesByResource(
    "property",
    inactivePropertyId,
  );
  await prisma.property.deleteMany({
    where: { id: { in: createdPropertyIds } },
  });

  console.log("availability-smoke ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
