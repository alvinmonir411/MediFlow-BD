import { NextRequest, NextResponse } from "next/server";
import { Repository } from "@/lib/repository";

export async function GET() {
  const doses = Repository.getTodayDoses();
  const adherence = Repository.getAdherenceRate();
  const patient = Repository.getPatient();

  return NextResponse.json({
    success: true,
    data: {
      patient,
      adherence,
      doses,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doseId, action, actor, reason } = body;

    if (!doseId || !action) {
      return NextResponse.json(
        { success: false, error: "doseId and action ('TAKEN' | 'SKIPPED') are required." },
        { status: 400 }
      );
    }

    let updatedDose;
    if (action === "TAKEN") {
      updatedDose = Repository.markDoseTaken(doseId, actor || "Patient");
    } else if (action === "SKIPPED") {
      updatedDose = Repository.skipDose(doseId, actor || "Patient", reason);
    }

    if (!updatedDose) {
      return NextResponse.json(
        { success: false, error: "Dose not found or already processed." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedDose,
      adherence: Repository.getAdherenceRate(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update dose status" },
      { status: 500 }
    );
  }
}
