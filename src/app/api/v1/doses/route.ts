import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    let patient;
    if (patientId && patientId !== "default") {
      patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { organization: true },
      });
    }

    if (!patient) {
      patient = await prisma.patient.findFirst({
        include: { organization: true },
      });
    }

    if (!patient) {
      return NextResponse.json({
        success: true,
        data: {
          patient: null,
          adherence: 100,
          doses: [],
        },
      });
    }

    // Get today's start and end timestamps
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch doses from Neon PostgreSQL for this specific patient
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

    const formattedDoses = doses.map((d) => {
      const hours = d.scheduledAt.getHours();
      const minutes = d.scheduledAt.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHour = (hours % 12 || 12).toString().padStart(2, "0");
      const timeStr = `${formattedHour}:${minutes} ${ampm}`;

      return {
        id: d.id,
        medicineName: d.schedule.medicineName,
        genericName: "Verified Formulation",
        dosage: d.schedule.dosage,
        timeSlot: d.timeSlot as "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT",
        scheduledTime: timeStr,
        status: d.status,
        foodTiming: d.schedule.foodTiming,
        takenAt: d.takenAt ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: true }).format(d.takenAt) : undefined,
        notes: d.notes,
      };
    });

    // Calculate real adherence rate
    const total = formattedDoses.length;
    const taken = formattedDoses.filter((d) => d.status === "TAKEN").length;
    const adherence = total === 0 ? 100 : Math.round((taken / total) * 100);

    return NextResponse.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          name: patient.name,
          bloodGroup: patient.bloodGroup || "Not specified",
          allergies: patient.allergies ? patient.allergies.split(",").map((a) => a.trim()) : [],
          chronicConditions: patient.chronicConditions ? patient.chronicConditions.split(",").map((c) => c.trim()) : [],
          emergencyContact: {
            name: "Emergency Contact",
            phone: patient.emergencyContact || "Not set",
          },
        },
        adherence,
        doses: formattedDoses,
      },
    });
  } catch (error: any) {
    console.error("Fetch doses error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch medication doses." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doseId, action, reason } = body;

    if (!doseId || !action) {
      return NextResponse.json(
        { success: false, error: "doseId and action ('TAKEN' | 'SKIPPED') are required." },
        { status: 400 }
      );
    }

    const newStatus = action === "TAKEN" ? "TAKEN" : "SKIPPED";
    const now = new Date();

    // Update in Neon PostgreSQL
    const updatedDose = await prisma.medicationDose.update({
      where: { id: doseId },
      data: {
        status: newStatus,
        takenAt: newStatus === "TAKEN" ? now : undefined,
        notes: reason ? `[Skipped: ${reason}]` : undefined,
      },
      include: {
        schedule: {
          include: {
            patient: true,
          },
        },
      },
    });

    // Record DoseLog in Neon PostgreSQL
    await prisma.doseLog.create({
      data: {
        doseId: updatedDose.id,
        action: newStatus === "TAKEN" ? "MARKED_TAKEN" : "SKIPPED",
        source: "WEB",
      },
    });

    // Record AuditLog in Neon PostgreSQL
    await prisma.auditLog.create({
      data: {
        organizationId: updatedDose.schedule.patient.organizationId,
        action: newStatus === "TAKEN" ? "DOSE_CONFIRMED_TAKEN" : "DOSE_SKIPPED",
        resourceType: "MedicationDose",
        resourceId: updatedDose.id,
        diffJson: JSON.stringify({
          medicine: updatedDose.schedule.medicineName,
          status: newStatus,
          timestamp: now.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedDose,
    });
  } catch (error: any) {
    console.error("Dose status update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update dose status." },
      { status: 500 }
    );
  }
}
