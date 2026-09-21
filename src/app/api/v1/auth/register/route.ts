import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, role } = body;

    if (!name || !password || (!email && !phone)) {
      return NextResponse.json(
        { success: false, error: "Name, password, and either email or phone are required." },
        { status: 400 }
      );
    }

    // Check if user already exists in Neon DB
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : {},
          phone ? { phone } : {},
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email or phone already exists." },
        { status: 409 }
      );
    }

    // 1. Create Organization (Tenant)
    const organization = await prisma.organization.create({
      data: {
        name: `${name}'s Family Healthcare`,
        type: "FAMILY",
      },
    });

    // 2. Hash Password and Create User
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        name,
        email: email || null,
        phone: phone || null,
        passwordHash,
        role: role === "CAREGIVER" ? "CAREGIVER" : "PATIENT",
      },
    });

    // 3. Create primary Patient record for this user
    const primaryPatient = await prisma.patient.create({
      data: {
        organizationId: organization.id,
        createdByUserId: user.id,
        name,
        gender: "Not specified",
        bloodGroup: "Not specified",
        emergencyContact: phone || "Not set",
      },
    });

    // 4. Create Audit Log in Neon DB
    await prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        action: "USER_REGISTERED",
        resourceType: "User",
        resourceId: user.id,
        diffJson: JSON.stringify({ email, phone, role: user.role }),
      },
    });

    // 5. Issue JWT Session Token
    const token = await createSessionToken({
      userId: user.id,
      organizationId: organization.id,
      role: user.role,
      email: user.email || undefined,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: organization.id,
      },
      primaryPatientId: primaryPatient.id,
    });

    // Set secure cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register user." },
      { status: 500 }
    );
  }
}
