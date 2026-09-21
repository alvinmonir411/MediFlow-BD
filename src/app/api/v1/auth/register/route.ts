import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password, photoUrl, photo, role } = body;

    // Section 2 Register Requirements: Name, Email, Password required
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Full Name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required (e.g. user@example.com)." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    // Section 2 Password requirements:
    // Minimum 6 characters, at least one uppercase letter, at least one lowercase letter
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Password must contain at least one uppercase letter (A-Z)." },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { success: false, error: "Password must contain at least one lowercase letter (a-z)." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhoto = (photoUrl || photo || "").trim() || null;

    // Check if user already exists in Neon DB
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          phone ? { phone: phone.trim() } : {},
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    // 1. Create Organization (Tenant) for the patient/family
    const organization = await prisma.organization.create({
      data: {
        name: `${name.trim()}'s Health Profile`,
        type: "FAMILY",
      },
    });

    // 2. Hash Password and Create User with optional profile photo
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        organizationId: organization.id,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        passwordHash,
        photo: cleanPhoto,
        role: role === "CAREGIVER" ? "CAREGIVER" : "PATIENT",
      },
    });

    // 3. Create primary Patient record for this user
    const primaryPatient = await prisma.patient.create({
      data: {
        organizationId: organization.id,
        createdByUserId: user.id,
        name: user.name,
        gender: "Not specified",
        bloodGroup: "B+",
        emergencyContact: phone ? phone.trim() : "Not set",
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
        diffJson: JSON.stringify({ email: cleanEmail, role: user.role, hasPhoto: !!cleanPhoto }),
      },
    });

    // 5. Issue JWT Session Token
    const token = await createSessionToken({
      userId: user.id,
      organizationId: organization.id,
      role: user.role,
      email: user.email || undefined,
      name: user.name,
      photo: user.photo || undefined,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully! Welcome to PrescriptionMate BD.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
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
