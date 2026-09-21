import { PrismaClient, Role } from "@prisma/client";
import { BANGLADESH_MEDICINE_CATALOG } from "../src/lib/safety/bangladesh-medicines";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MediFlow BD Database on Neon PostgreSQL...");

  // 1. Create Organization (Tenant)
  const org = await prisma.organization.create({
    data: {
      name: "MediFlow Dhaka Central",
      type: "CLINIC",
    },
  });

  // 2. Create Primary Admin / Doctor User
  const doctor = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Dr. K. M. Rahman",
      email: "dr.rahman@mediflow.bd",
      phone: "+8801700000001",
      role: Role.DOCTOR,
    },
  });

  // 3. Create Patient
  const patient = await prisma.patient.create({
    data: {
      organizationId: org.id,
      createdByUserId: doctor.id,
      name: "Md. Rafiqul Islam",
      gender: "Male",
      bloodGroup: "B+",
      emergencyContact: "+8801819987654",
      allergies: "Penicillin, Sulfa",
      chronicConditions: "Hypertension, Type 2 Diabetes",
    },
  });

  // 4. Seed Verified Bangladesh Medicine Catalog
  console.log(`📦 Seeding ${BANGLADESH_MEDICINE_CATALOG.length} verified Bangladesh medicines...`);
  for (const med of BANGLADESH_MEDICINE_CATALOG) {
    await prisma.medicineCatalog.create({
      data: {
        brandName: med.brandName,
        genericName: med.genericName,
        strength: med.strength,
        dosageForm: med.dosageForm,
        manufacturer: med.manufacturer,
        unitPrice: med.unitPrice,
        isAntibiotic: med.isAntibiotic,
        instructions: med.defaultInstructions,
      },
    });
  }

  // 5. Create Initial Audit Log
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: doctor.id,
      action: "INITIAL_DATABASE_SEEDED",
      resourceType: "Organization",
      resourceId: org.id,
      diffJson: JSON.stringify({ seededMedicines: BANGLADESH_MEDICINE_CATALOG.length }),
    },
  });

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
