import { DoseStatus, FoodInstruction } from "@prisma/client";

export interface DoseItem {
  id: string;
  medicineName: string;
  genericName?: string;
  dosage: string;
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  scheduledTime: string; // e.g. "08:00 AM"
  status: "SCHEDULED" | "TAKEN" | "MISSED" | "SKIPPED";
  foodTiming: "BEFORE_FOOD" | "AFTER_FOOD" | "EMPTY_STOMACH" | "WITH_FOOD";
  takenAt?: string;
  notes?: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  resourceType: string;
  details: string;
}

// In-memory persistent state (persists across API requests in server process)
let patient: PatientProfile = {
  id: "pat-101",
  name: "Md. Rafiqul Islam (রফিকুল ইসলাম)",
  age: 62,
  gender: "Male",
  bloodGroup: "B+ (Positive)",
  phone: "+880 1711-234567",
  emergencyContact: {
    name: "Tanvir Islam (Son)",
    relationship: "Son / Primary Caregiver",
    phone: "+880 1819-987654",
  },
  allergies: ["Penicillin (Severe Rash)", "Sulfa drugs"],
  chronicConditions: ["Hypertension (উচ্চ রক্তচাপ)", "Type 2 Diabetes (ডায়াবেটিস)"],
};

let todayDoses: DoseItem[] = [
  {
    id: "dose-1",
    medicineName: "Seclo 20mg",
    genericName: "Omeprazole",
    dosage: "1 Capsule",
    timeSlot: "MORNING",
    scheduledTime: "07:30 AM",
    status: "TAKEN",
    foodTiming: "BEFORE_FOOD",
    takenAt: "07:35 AM",
    notes: "সকালে খালি পেটে এক গ্লাস পানির সাথে",
  },
  {
    id: "dose-2",
    medicineName: "Camlosart 5/50",
    genericName: "Amlodipine + Losartan",
    dosage: "1 Tablet",
    timeSlot: "MORNING",
    scheduledTime: "08:30 AM",
    status: "TAKEN",
    foodTiming: "AFTER_FOOD",
    takenAt: "08:42 AM",
    notes: "প্রেসারের ওষুধ, নিয়মিত সেব্য",
  },
  {
    id: "dose-3",
    medicineName: "Comprid 500mg",
    genericName: "Metformin",
    dosage: "1 Tablet",
    timeSlot: "AFTERNOON",
    scheduledTime: "01:30 PM",
    status: "SCHEDULED",
    foodTiming: "AFTER_FOOD",
    notes: "দুপুরের খাবারের মাঝে বা ঠিক পরে",
  },
  {
    id: "dose-4",
    medicineName: "Napa 500mg",
    genericName: "Paracetamol",
    dosage: "1 Tablet",
    timeSlot: "NIGHT",
    scheduledTime: "09:00 PM",
    status: "SCHEDULED",
    foodTiming: "AFTER_FOOD",
    notes: "ভরা পেটে খাবেন",
  },
  {
    id: "dose-5",
    medicineName: "Monas 10mg",
    genericName: "Montelukast",
    dosage: "1 Tablet",
    timeSlot: "NIGHT",
    scheduledTime: "10:00 PM",
    status: "SCHEDULED",
    foodTiming: "BEFORE_FOOD",
    notes: "ঘুমানোর পূর্বে সেব্য",
  },
];

let auditLogs: AuditLogItem[] = [
  {
    id: "log-1",
    timestamp: "2026-09-21 07:35:12",
    actor: "Md. Rafiqul Islam",
    role: "PATIENT",
    action: "DOSE_MARKED_TAKEN",
    resourceType: "MedicationDose",
    details: "Dose 'Seclo 20mg' confirmed taken at 07:35 AM",
  },
  {
    id: "log-2",
    timestamp: "2026-09-21 08:42:05",
    actor: "Tanvir Islam",
    role: "CAREGIVER",
    action: "DOSE_MARKED_TAKEN",
    resourceType: "MedicationDose",
    details: "Caregiver marked 'Camlosart 5/50' as taken on behalf of patient",
  },
  {
    id: "log-3",
    timestamp: "2026-09-20 18:30:00",
    actor: "Dr. K. M. Rahman",
    role: "DOCTOR",
    action: "PRESCRIPTION_CONFIRMED",
    resourceType: "Prescription",
    details: "Prescription confirmed with 3 medicines. Schedules generated for 14 days.",
  },
];

export const Repository = {
  getPatient(): PatientProfile {
    return patient;
  },

  getTodayDoses(): DoseItem[] {
    return todayDoses;
  },

  markDoseTaken(doseId: string, actor: string = "Patient"): DoseItem | null {
    const dose = todayDoses.find((d) => d.id === doseId);
    if (!dose) return null;

    dose.status = "TAKEN";
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    dose.takenAt = timeStr;

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      actor,
      role: "PATIENT",
      action: "DOSE_MARKED_TAKEN",
      resourceType: "MedicationDose",
      details: `Dose '${dose.medicineName}' confirmed taken at ${timeStr}`,
    });

    return dose;
  },

  skipDose(doseId: string, actor: string = "Patient", reason?: string): DoseItem | null {
    const dose = todayDoses.find((d) => d.id === doseId);
    if (!dose) return null;

    dose.status = "SKIPPED";
    dose.notes = reason ? `${dose.notes || ""} [Skipped: ${reason}]` : dose.notes;

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      actor,
      role: "PATIENT",
      action: "DOSE_SKIPPED",
      resourceType: "MedicationDose",
      details: `Dose '${dose.medicineName}' was skipped. Reason: ${reason || "User decided to skip"}`,
    });

    return dose;
  },

  addPrescriptionToSchedule(
    doctorName: string,
    hospitalName: string,
    medicines: Array<{
      resolvedBrand: string;
      resolvedGeneric: string;
      dose: string;
      frequency: string;
      foodTiming: string;
      durationDays: number;
    }>
  ) {
    // Generate new doses for today based on frequency
    medicines.forEach((med, idx) => {
      const isMorning = med.frequency.startsWith("1");
      const isNight = med.frequency.endsWith("1");

      if (isMorning) {
        todayDoses.push({
          id: `dose-new-${Date.now()}-${idx}-m`,
          medicineName: `${med.resolvedBrand}`,
          genericName: med.resolvedGeneric,
          dosage: med.dose,
          timeSlot: "MORNING",
          scheduledTime: "08:00 AM",
          status: "SCHEDULED",
          foodTiming: (med.foodTiming as any) || "AFTER_FOOD",
          notes: `Prescribed by ${doctorName}`,
        });
      }

      if (isNight) {
        todayDoses.push({
          id: `dose-new-${Date.now()}-${idx}-n`,
          medicineName: `${med.resolvedBrand}`,
          genericName: med.resolvedGeneric,
          dosage: med.dose,
          timeSlot: "NIGHT",
          scheduledTime: "09:30 PM",
          status: "SCHEDULED",
          foodTiming: (med.foodTiming as any) || "AFTER_FOOD",
          notes: `Prescribed by ${doctorName}`,
        });
      }
    });

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      actor: "Patient / Verified Human",
      role: "PATIENT",
      action: "PRESCRIPTION_VERIFIED_AND_ACTIVATED",
      resourceType: "Prescription",
      details: `Prescription from ${doctorName} confirmed. ${medicines.length} medicines scheduled.`,
    });

    return todayDoses;
  },

  getAuditLogs(): AuditLogItem[] {
    return auditLogs;
  },

  getAdherenceRate(): number {
    const total = todayDoses.length;
    if (total === 0) return 100;
    const taken = todayDoses.filter((d) => d.status === "TAKEN").length;
    return Math.round((taken / total) * 100);
  },
};
