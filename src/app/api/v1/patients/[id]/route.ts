import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        schedules: { where: { isActive: true } },
        prescriptions: { include: { medicines: true } },
      },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 });
    }

    // Enforce tenant isolation — only allow access to patients in the same org
    if (session && patient.organizationId !== session.organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You cannot access this patient profile." },
        { status: 403 }
      );
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
    const session = await getSessionUser(req);
    const { id } = await params;
    const body = await req.json();

    // Verify patient belongs to the user's org
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Patient not found." }, { status: 404 });
    }

    if (session && existing.organizationId !== session.organizationId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: You cannot update this patient profile." },
        { status: 403 }
      );
    }

    const {
      name,
      gender,
      bloodGroup,
      phone,
      address,
      emergencyContact,
      allergies,
      chronicConditions,
      dateOfBirth,
    } = body;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        name:               name               !== undefined ? String(name).trim()               : undefined,
        gender:             gender             !== undefined ? gender                             : undefined,
        bloodGroup:         bloodGroup         !== undefined ? bloodGroup                         : undefined,
        phone:              phone              !== undefined ? String(phone).trim() || null       : undefined,
        address:            address            !== undefined ? String(address).trim() || null     : undefined,
        emergencyContact:   emergencyContact   !== undefined ? String(emergencyContact).trim() || null : undefined,
        allergies:          allergies          !== undefined ? String(allergies).trim() || null   : undefined,
        chronicConditions:  chronicConditions  !== undefined ? String(chronicConditions).trim() || null : undefined,
        dateOfBirth:        dateOfBirth        ? new Date(dateOfBirth)                           : undefined,
      },
    });

    // Write audit log
    if (session) {
      await prisma.auditLog.create({
        data: {
          organizationId: existing.organizationId,
          userId: session.userId,
          action: "PATIENT_PROFILE_UPDATED",
          resourceType: "Patient",
          resourceId: id,
          diffJson: JSON.stringify({ fields: Object.keys(body) }),
        },
      }).catch(() => {}); // non-blocking
    }

    return NextResponse.json({
      success: true,
      message: "Patient profile updated successfully.",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(req);
    const { id } = await params;

    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Patient not found." }, { status: 404 });
    }

    if (!session || existing.organizationId !== session.organizationId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 403 });
    }

    await prisma.patient.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Patient profile deleted." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
