import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    // 1. Resolve Patient
    let patient = null;
    if (patientId && patientId !== "default") {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });
    }

    if (!patient && session?.userId) {
      patient = await prisma.patient.findFirst({
        where: { createdByUserId: session.userId },
      });
    }

    if (!patient) {
      patient = await prisma.patient.findFirst();
    }

    if (!patient) {
      return NextResponse.json({
        success: true,
        data: {
          patient: null,
          metrics: {
            todayMedicines: 0,
            taken: 0,
            pending: 0,
            missed: 0,
          },
          adherence: 100,
          upcomingDose: null,
          todaySchedule: [],
          recentPrescriptions: [],
          emergencyShortcut: null,
        },
      });
    }

    // 2. Define Today's Window (00:00:00 to 23:59:59.999)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 3. Fetch Today's Medication Doses for this patient
    const doses = await prisma.medicationDose.findMany({
      where: {
        schedule: {
          patientId: patient.id,
          isActive: true,
        },
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        schedule: true,
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    // 4. Format Doses & Calculate 4 Metrics
    const formattedSchedule = doses.map((d) => {
      const hours = d.scheduledAt.getHours();
      const minutes = d.scheduledAt.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHour = (hours % 12 || 12).toString().padStart(2, "0");
      const timeStr = `${formattedHour}:${minutes} ${ampm}`;

      // Check if scheduled time is in the past by more than 30 minutes and still marked SCHEDULED
      const isOverdue = d.status === "SCHEDULED" && d.scheduledAt.getTime() < (now.getTime() - 30 * 60 * 1000);
      const effectiveStatus = isOverdue ? "MISSED" : d.status;

      return {
        id: d.id,
        medicineName: d.schedule.medicineName,
        dosage: d.schedule.dosage,
        frequency: d.schedule.frequency,
        timeSlot: d.timeSlot,
        scheduledTime: timeStr,
        scheduledAt: d.scheduledAt.toISOString(),
        status: effectiveStatus,
        foodTiming: d.schedule.foodTiming,
        takenAt: d.takenAt
          ? new Intl.DateTimeFormat("en-BD", { hour: "numeric", minute: "numeric", hour12: true }).format(d.takenAt)
          : undefined,
        notes: d.notes,
      };
    });

    const todayMedicines = formattedSchedule.length;
    const taken = formattedSchedule.filter((d) => d.status === "TAKEN").length;
    const pending = formattedSchedule.filter((d) => d.status === "SCHEDULED" || d.status === "REMINDER_SENT").length;
    const missed = formattedSchedule.filter((d) => d.status === "MISSED").length;

    // Adherence Percentage: Taken / (Taken + Missed + Skipped) or Taken / Total
    const adherence = todayMedicines === 0 ? 100 : Math.round((taken / todayMedicines) * 100);

    // 5. Determine Immediate Upcoming Dose
    // Earliest dose today that is still pending/scheduled
    const pendingList = formattedSchedule.filter(
      (d) => d.status === "SCHEDULED" || d.status === "REMINDER_SENT"
    );
    const upcomingDose = pendingList.length > 0 ? pendingList[0] : null;

    // 6. Fetch Recent Prescriptions for this Patient
    const recentPrescriptionsRaw = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        medicines: {
          select: { id: true, rawName: true, dose: true, frequency: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    const recentPrescriptions = recentPrescriptionsRaw.map((p) => ({
      id: p.id,
      doctorName: p.doctorName || "Dr. Prescription Specialist",
      hospitalName: p.hospitalName || "General Clinic / Hospital",
      prescriptionDate: p.prescriptionDate
        ? new Date(p.prescriptionDate).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })
        : new Date(p.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }),
      status: p.status,
      medicineCount: p.medicines.length,
      medicinesSummary: p.medicines.slice(0, 3).map((m) => m.rawName).join(", "),
      createdAt: p.createdAt.toISOString(),
    }));

    // 7. Emergency Shortcut Payload
    const emergencyShortcut = {
      patientName: patient.name,
      bloodGroup: patient.bloodGroup || "Not specified",
      allergies: patient.allergies ? patient.allergies.split(",").map((a) => a.trim()).filter(Boolean) : [],
      emergencyContact: patient.emergencyContact || null,
      chronicConditions: patient.chronicConditions ? patient.chronicConditions.split(",").map((c) => c.trim()).filter(Boolean) : [],
    };

    return NextResponse.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          name: patient.name,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodGroup: patient.bloodGroup,
          phone: patient.phone,
          allergies: patient.allergies,
          emergencyContact: patient.emergencyContact,
        },
        metrics: {
          todayMedicines,
          taken,
          pending,
          missed,
        },
        adherence,
        upcomingDose,
        todaySchedule: formattedSchedule,
        recentPrescriptions,
        emergencyShortcut,
      },
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
