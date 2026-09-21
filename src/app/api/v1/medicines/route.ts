import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    let medicines;
    if (query.trim()) {
      medicines = await prisma.medicineCatalog.findMany({
        where: {
          OR: [
            { brandName: { contains: query.trim(), mode: "insensitive" } },
            { genericName: { contains: query.trim(), mode: "insensitive" } },
          ],
        },
        orderBy: { brandName: "asc" },
        take: limit,
      });
    } else {
      medicines = await prisma.medicineCatalog.findMany({
        orderBy: { brandName: "asc" },
        take: limit,
      });
    }

    // Format strictly conforming to AGENTS.md Section 8 spec:
    // brand_name, generic_name, strength, dosage_form, manufacturer, status
    const formatted = medicines.map((m) => ({
      id: m.id,
      brand_name: m.brandName,
      generic_name: m.genericName,
      strength: m.strength,
      dosage_form: m.dosageForm,
      manufacturer: m.manufacturer,
      unit_price: m.unitPrice ? Number(m.unitPrice) : null,
      is_antibiotic: m.isAntibiotic,
      instructions: m.instructions,
      status: m.status,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Medicine database query error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query medicine database." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brand_name, generic_name, strength, dosage_form, manufacturer, unit_price, is_antibiotic, instructions } = body;

    if (!brand_name || !generic_name) {
      return NextResponse.json(
        { success: false, error: "brand_name and generic_name are required." },
        { status: 400 }
      );
    }

    const created = await prisma.medicineCatalog.create({
      data: {
        brandName: brand_name.trim(),
        genericName: generic_name.trim(),
        strength: strength?.trim() || "Standard",
        dosageForm: dosage_form?.trim() || "Tablet",
        manufacturer: manufacturer?.trim() || "Pharmaceuticals Ltd.",
        unitPrice: unit_price ? Number(unit_price) : 0,
        isAntibiotic: Boolean(is_antibiotic),
        instructions: instructions?.trim() || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: created.id,
        brand_name: created.brandName,
        generic_name: created.genericName,
        strength: created.strength,
        dosage_form: created.dosageForm,
        manufacturer: created.manufacturer,
        status: created.status,
      },
    });
  } catch (error: any) {
    console.error("Add medicine error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add medicine." },
      { status: 500 }
    );
  }
}
