import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    let orgId = session?.organizationId;

    if (!orgId) {
      // If no session, get default org from Neon DB
      const defaultOrg = await prisma.organization.findFirst();
      orgId = defaultOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const patients = await prisma.patient.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: {
            schedules: true,
            prescriptions: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error: any) {
    console.error("Fetch patients error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch patients." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const body = await req.json();
    const { name, gender, bloodGroup, emergencyContact, allergies, chronicConditions, dateOfBirth } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Patient name is required." },
        { status: 400 }
      );
    }

    let orgId = session?.organizationId;
    let userId = session?.userId;

    if (!orgId || !userId) {
      // Fallback to first org and doctor user in Neon DB
      const defaultOrg = await prisma.organization.findFirst({
        include: { users: true },
      });
      orgId = defaultOrg?.id;
      userId = defaultOrg?.users[0]?.id;
    }

    if (!orgId || !userId) {
      return NextResponse.json(
        { success: false, error: "Organization not initialized. Please register first." },
        { status: 400 }
      );
    }

    // Create real family patient profile in Neon PostgreSQL
    const newPatient = await prisma.patient.create({
      data: {
        organizationId: orgId,
        createdByUserId: userId,
        name: name.trim(),
        gender: gender || "Not specified",
        bloodGroup: bloodGroup || "Not specified",
        emergencyContact: emergencyContact || "Not set",
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    // Write audit log to Neon DB
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        userId,
        action: "FAMILY_PATIENT_ADDED",
        resourceType: "Patient",
        resourceId: newPatient.id,
        diffJson: JSON.stringify({ name: newPatient.name, bloodGroup: newPatient.bloodGroup }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Family member ${newPatient.name} successfully added!`,
      data: newPatient,
    });
  } catch (error: any) {
    console.error("Create patient error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create patient profile." },
      { status: 500 }
    );
  }
}
