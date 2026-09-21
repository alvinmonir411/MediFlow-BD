import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, name, photo, googleId, credential } = body;

    // If a Google JWT ID Token (from Google Identity Services) is passed, decode it
    if (credential && typeof credential === "string") {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
          const payload = JSON.parse(payloadStr);
          email = payload.email || email;
          name = payload.name || payload.given_name || name;
          photo = payload.picture || photo;
          googleId = payload.sub || googleId;
        }
      } catch (err) {
        console.warn("Failed to decode Google credential token:", err);
      }
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "A valid email is required for Google Sign-In." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split("@")[0] || "Google User").trim();
    const cleanPhoto = photo?.trim() || null;

    // Check if user already exists in Neon DB
    let user = await prisma.user.findFirst({
      where: { email: cleanEmail },
      include: { organization: true },
    });

    let organizationId: string;
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // 1. Create Organization for new Google user
      const organization = await prisma.organization.create({
        data: {
          name: `${cleanName}'s Health Profile`,
          type: "FAMILY",
        },
      });
      organizationId = organization.id;

      // 2. Create User record
      user = await prisma.user.create({
        data: {
          organizationId: organization.id,
          name: cleanName,
          email: cleanEmail,
          photo: cleanPhoto,
          role: "PATIENT",
        },
        include: { organization: true },
      });

      // 3. Create primary Patient profile
      await prisma.patient.create({
        data: {
          organizationId: organization.id,
          createdByUserId: user.id,
          name: cleanName,
          gender: "Not specified",
          bloodGroup: "B+",
          emergencyContact: "Not set",
        },
      });

      // 4. Create Audit Log for registration
      await prisma.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: "USER_REGISTERED_GOOGLE",
          resourceType: "User",
          resourceId: user.id,
          diffJson: JSON.stringify({ email: cleanEmail, provider: "google" }),
        },
      });
    } else {
      organizationId = user.organizationId;
      // If user exists and doesn't have photo yet, update with Google avatar
      if (!user.photo && cleanPhoto) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { photo: cleanPhoto },
          include: { organization: true },
        });
      }
    }

    // Record login audit log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: user.id,
        action: "USER_LOGGED_IN_GOOGLE",
        resourceType: "User",
        resourceId: user.id,
      },
    });

    // Get patients for session
    const patients = await prisma.patient.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });

    // Issue JWT Session Token
    const token = await createSessionToken({
      userId: user.id,
      organizationId,
      role: user.role,
      email: user.email || undefined,
      name: user.name,
      photo: user.photo || undefined,
    });

    const response = NextResponse.json({
      success: true,
      message: isNewUser
        ? "Welcome to PrescriptionMate BD! Your Google account has been connected."
        : "Welcome back! Google Sign-In successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        role: user.role,
        organizationId,
      },
      patients,
    });

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
    console.error("Google login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Google Sign-In failed." },
      { status: 500 }
    );
  }
}
