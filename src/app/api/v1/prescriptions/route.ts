import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
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

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: targetPatientId },
      include: {
        medicines: true,
        patient: {
          select: { name: true, bloodGroup: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: prescriptions,
    });
  } catch (error: any) {
    console.error("Fetch prescriptions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch prescriptions." },
      { status: 500 }
    );
  }
}
