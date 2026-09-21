import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        schedules: {
          where: { isActive: true },
        },
        prescriptions: {
          include: { medicines: true },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, gender, bloodGroup, emergencyContact, allergies, chronicConditions, dateOfBirth } = body;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        gender: gender !== undefined ? gender : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : undefined,
        allergies: allergies !== undefined ? allergies : undefined,
        chronicConditions: chronicConditions !== undefined ? chronicConditions : undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Patient profile updated successfully in Neon DB.",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
