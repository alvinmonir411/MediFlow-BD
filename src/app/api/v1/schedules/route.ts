import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function parseFrequencyToSlots(freq: string): string[] {
  const parts = freq.split("+").map((p) => p.trim());
  const slots: string[] = [];

  if (parts.length >= 1 && parseInt(parts[0]) > 0) slots.push("MORNING");
  if (parts.length >= 2 && parseInt(parts[1]) > 0) slots.push("AFTERNOON");
  if (parts.length >= 3 && parseInt(parts[2]) > 0) slots.push("NIGHT");

  return slots.length > 0 ? slots : ["MORNING"];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    let targetPatientId = patientId;
    if (!targetPatientId || targetPatientId === "default") {
      const firstPatient = await prisma.patient.findFirst();
      targetPatientId = firstPatient ? firstPatient.id : null;
    }

    if (!targetPatientId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const schedules = await prisma.medicationSchedule.findMany({
      where: { patientId: targetPatientId },
      include: {
        prescriptionMedicine: true,
        _count: {
          select: { doses: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = schedules.map((s) => {
      const slots = parseFrequencyToSlots(s.frequency);
      const reminderTimes = slots.map((slot) => {
        if (slot === "MORNING") return "08:00 AM";
        if (slot === "AFTERNOON") return "01:00 PM";
        return "09:00 PM";
      });

      return {
        id: s.id,
        patientId: s.patientId,
        medicineName: s.medicineName,
        dosage: s.dosage,
        frequency: s.frequency,
        foodTiming: s.foodTiming,
        startDate: s.startDate.toISOString().split("T")[0],
        endDate: s.endDate ? s.endDate.toISOString().split("T")[0] : null,
        reminderTimes,
        isActive: s.isActive,
        dosesCount: s._count.doses,
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Fetch schedules error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch medication schedules." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const body = await req.json();
    const { patientId, medicineName, dosage, frequency, foodTiming, startDate, endDate, durationDays } = body;

    if (!medicineName) {
      return NextResponse.json(
        { success: false, error: "Medicine name is required." },
        { status: 400 }
      );
    }

    let targetPatientId = patientId;
    if (!targetPatientId || targetPatientId === "default") {
      const firstPatient = await prisma.patient.findFirst();
      targetPatientId = firstPatient ? firstPatient.id : null;
    }

    if (!targetPatientId) {
      return NextResponse.json(
        { success: false, error: "No patient profile found. Please create a patient profile first." },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : null;
    if (!end && durationDays) {
      end = new Date(start);
      end.setDate(end.getDate() + parseInt(durationDays));
    }

    const schedule = await prisma.medicationSchedule.create({
      data: {
        patientId: targetPatientId,
        medicineName: medicineName.trim(),
        dosage: dosage?.trim() || "1 Tablet",
        frequency: frequency?.trim() || "1+0+1",
        foodTiming: foodTiming || "AFTER_FOOD",
        startDate: start,
        endDate: end,
        isActive: true,
      },
      include: {
        patient: {
          select: { organizationId: true },
        },
      },
    });

    // Create today's initial dose slots
    const today = new Date();
    const slots = parseFrequencyToSlots(schedule.frequency);

    for (const slot of slots) {
      let scheduledHour = 8;
      if (slot === "AFTERNOON") scheduledHour = 13;
      if (slot === "NIGHT") scheduledHour = 21;

      const scheduledTime = new Date(today);
      scheduledTime.setHours(scheduledHour, 0, 0, 0);

      await prisma.medicationDose.create({
        data: {
          scheduleId: schedule.id,
          timeSlot: slot,
          scheduledAt: scheduledTime,
          status: "SCHEDULED",
        },
      });
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: schedule.patient.organizationId,
        userId: session?.userId || null,
        action: "MEDICATION_SCHEDULE_CREATED",
        resourceType: "MedicationSchedule",
        resourceId: schedule.id,
        diffJson: JSON.stringify({
          medicineName: schedule.medicineName,
          dosage: schedule.dosage,
          frequency: schedule.frequency,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error("Create schedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create medication schedule." },
      { status: 500 }
    );
  }
}
