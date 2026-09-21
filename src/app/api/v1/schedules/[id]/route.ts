import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);
    const body = await req.json();

    const { dosage, frequency, foodTiming, endDate, isActive } = body;

    const existing = await prisma.medicationSchedule.findUnique({
      where: { id },
      include: {
        patient: { select: { organizationId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Schedule not found." }, { status: 404 });
    }

    const updated = await prisma.medicationSchedule.update({
      where: { id },
      data: {
        dosage: dosage !== undefined ? dosage : existing.dosage,
        frequency: frequency !== undefined ? frequency : existing.frequency,
        foodTiming: foodTiming !== undefined ? foodTiming : existing.foodTiming,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existing.patient.organizationId,
        userId: session?.userId || null,
        action: "MEDICATION_SCHEDULE_UPDATED",
        resourceType: "MedicationSchedule",
        resourceId: id,
        diffJson: JSON.stringify(body),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Update schedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update schedule." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionUser(req);

    const existing = await prisma.medicationSchedule.findUnique({
      where: { id },
      include: {
        patient: { select: { organizationId: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Schedule not found." }, { status: 404 });
    }

    // Soft-deactivate schedule
    await prisma.medicationSchedule.update({
      where: { id },
      data: { isActive: false },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        organizationId: existing.patient.organizationId,
        userId: session?.userId || null,
        action: "MEDICATION_SCHEDULE_DEACTIVATED",
        resourceType: "MedicationSchedule",
        resourceId: id,
        diffJson: JSON.stringify({ deactivated: true }),
      },
    });

    return NextResponse.json({ success: true, message: "Medication schedule paused/deactivated." });
  } catch (error: any) {
    console.error("Delete schedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete schedule." },
      { status: 500 }
    );
  }
}
