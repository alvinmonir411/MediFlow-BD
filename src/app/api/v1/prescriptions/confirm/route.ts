import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFrequencyToSlots } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doctorName, hospitalName, prescriptionDate, medicines, patientId } = body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one medicine is required to confirm a prescription." },
        { status: 400 }
      );
    }

    // Get primary patient or first patient from Neon DB
    let patient = await prisma.patient.findFirst({
      include: { organization: true },
    });

    if (!patient) {
      // Create primary organization and patient if not exists
      const org = await prisma.organization.create({
        data: { name: "MediFlow Primary Clinic", type: "CLINIC" },
      });
      const doctor = await prisma.user.create({
        data: {
          organizationId: org.id,
          name: "Dr. K. M. Rahman",
          email: "doctor@mediflow.bd",
          role: "DOCTOR",
        },
      });
      patient = await prisma.patient.create({
        data: {
          organizationId: org.id,
          createdByUserId: doctor.id,
          name: "Registered Patient",
          gender: "Male",
          bloodGroup: "B+",
        },
        include: { organization: true },
      });
    }

    // 1. Create Prescription in Neon DB
    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorName: doctorName || "Registered Physician",
        hospitalName: hospitalName || "Hospital / Medical Center",
        prescriptionDate: prescriptionDate ? new Date(prescriptionDate) : new Date(),
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // 2. Create PrescriptionMedicines, MedicationSchedules, and Today's MedicationDoses
    const createdSchedules = [];
    const today = new Date();

    for (const med of medicines) {
      // Create line item
      const presMed = await prisma.prescriptionMedicine.create({
        data: {
          prescriptionId: prescription.id,
          rawName: med.rawName || med.resolvedBrand,
          resolvedBrand: med.resolvedBrand,
          resolvedGeneric: med.resolvedGeneric,
          strength: med.strength || "",
          dose: med.dose || "1 Tablet",
          frequency: med.frequency || "1+0+1",
          foodTiming: (med.foodTiming as any) || "AFTER_FOOD",
          durationDays: med.durationDays || 5,
          confidenceScore: med.confidenceScore || 0.95,
        },
      });

      // Create Active Schedule
      const schedule = await prisma.medicationSchedule.create({
        data: {
          patientId: patient.id,
          prescriptionMedicineId: presMed.id,
          medicineName: med.resolvedBrand,
          dosage: med.dose || "1 Tablet",
          frequency: med.frequency || "1+0+1",
          foodTiming: (med.foodTiming as any) || "AFTER_FOOD",
          startDate: today,
          isActive: true,
        },
      });

      createdSchedules.push(schedule);

      // Determine today's dose slots from frequency (e.g. 1+0+1 -> MORNING, NIGHT)
      const slots = parseFrequencyToSlots(med.frequency || "1+0+1");

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
            notes: `Prescribed by ${doctorName || "Doctor"}`,
          },
        });
      }
    }

    // 3. Write immutable Audit Log to Neon DB
    await prisma.auditLog.create({
      data: {
        organizationId: patient.organizationId,
        action: "PRESCRIPTION_VERIFIED_AND_SCHEDULED",
        resourceType: "Prescription",
        resourceId: prescription.id,
        diffJson: JSON.stringify({
          doctor: doctorName,
          medicineCount: medicines.length,
          medicines: medicines.map((m: any) => m.resolvedBrand),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Prescription confirmed and real schedules successfully saved to Neon PostgreSQL!",
      prescriptionId: prescription.id,
      scheduleCount: createdSchedules.length,
    });
  } catch (error: any) {
    console.error("Prescription confirmation database error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to commit prescription to database." },
      { status: 500 }
    );
  }
}
