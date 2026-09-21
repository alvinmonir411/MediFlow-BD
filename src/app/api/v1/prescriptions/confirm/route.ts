import { NextRequest, NextResponse } from "next/server";
import { Repository } from "@/lib/repository";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doctorName, hospitalName, medicines, patientId } = body;

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one medicine is required to confirm a prescription." },
        { status: 400 }
      );
    }

    const updatedDoses = Repository.addPrescriptionToSchedule(
      doctorName || "Prescribing Doctor",
      hospitalName || "General Hospital",
      medicines
    );

    return NextResponse.json({
      success: true,
      message: "Prescription successfully verified and added to active schedules!",
      doses: updatedDoses,
    });
  } catch (error: any) {
    console.error("Prescription confirmation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm prescription" },
      { status: 500 }
    );
  }
}
