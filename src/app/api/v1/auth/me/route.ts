import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);

    if (!session) {
      // Fallback: If no logged in user yet, return the default seeded organization and patients for immediate preview
      const defaultOrg = await prisma.organization.findFirst({
        include: {
          patients: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
        organization: defaultOrg,
        patients: defaultOrg?.patients || [],
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organization: {
          include: {
            patients: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organizationId: user.organizationId,
      },
      organization: user.organization,
      patients: user.organization.patients,
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve session." },
      { status: 500 }
    );
  }
}
