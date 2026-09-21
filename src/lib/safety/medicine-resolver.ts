import { BANGLADESH_MEDICINE_CATALOG, type MedicineCatalogItem } from "./bangladesh-medicines";

export interface ResolvedMedicineResult {
  rawName: string;
  matchedCatalogItem?: MedicineCatalogItem;
  resolvedBrand: string;
  resolvedGeneric: string;
  strength: string;
  dose: string;
  frequency: string;
  foodTiming: "BEFORE_FOOD" | "AFTER_FOOD" | "EMPTY_STOMACH" | "WITH_FOOD" | "AS_NEEDED";
  durationDays: number;
  confidenceScore: number;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  isAntibiotic: boolean;
  safetyAlerts: string[];
}

export function resolveMedicine(
  rawName: string,
  rawStrength?: string,
  rawFrequency: string = "1+0+1",
  rawTiming?: string,
  rawDuration?: number
): ResolvedMedicineResult {
  const cleanInput = rawName.trim().toLowerCase();
  
  // Fuzzy / substring matching against Bangladesh catalog
  let bestMatch: MedicineCatalogItem | undefined;
  let highestScore = 0.5; // Base threshold

  for (const item of BANGLADESH_MEDICINE_CATALOG) {
    const brandLower = item.brandName.toLowerCase();
    const genericLower = item.genericName.toLowerCase();

    if (cleanInput === brandLower) {
      bestMatch = item;
      highestScore = 0.98;
      break;
    } else if (cleanInput.startsWith(brandLower) || brandLower.startsWith(cleanInput)) {
      bestMatch = item;
      highestScore = Math.max(highestScore, 0.92);
    } else if (cleanInput.includes(brandLower) || brandLower.includes(cleanInput)) {
      bestMatch = item;
      highestScore = Math.max(highestScore, 0.85);
    } else if (cleanInput.includes(genericLower)) {
      bestMatch = item;
      highestScore = Math.max(highestScore, 0.80);
    }
  }

  // Calculate confidence level
  let confidenceLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (highestScore >= 0.90) {
    confidenceLevel = "HIGH";
  } else if (highestScore >= 0.75) {
    confidenceLevel = "MEDIUM";
  }

  // Food timing normalization
  let foodTiming: "BEFORE_FOOD" | "AFTER_FOOD" | "EMPTY_STOMACH" | "WITH_FOOD" | "AS_NEEDED" = "AFTER_FOOD";
  const timingLower = (rawTiming || "").toLowerCase();
  if (timingLower.includes("before") || timingLower.includes("খাবারের আগে") || (bestMatch && (bestMatch.brandName === "Seclo" || bestMatch.brandName === "Sergel" || bestMatch.brandName === "Maxpro"))) {
    foodTiming = "BEFORE_FOOD";
  } else if (timingLower.includes("empty") || timingLower.includes("খালি পেটে")) {
    foodTiming = "EMPTY_STOMACH";
  } else if (timingLower.includes("with") || timingLower.includes("সাথে")) {
    foodTiming = "WITH_FOOD";
  }

  // Safety checks
  const safetyAlerts: string[] = [];
  const isAntibiotic = bestMatch ? bestMatch.isAntibiotic : false;

  if (isAntibiotic) {
    safetyAlerts.push("⚠️ অ্যান্টিবায়োটিক সতর্কবার্তা: চিকিৎসকের নির্দেশিত পূর্ণ মেয়াদ শেষ করুন। নিজে থেকে বন্ধ করবেন না।");
  }

  return {
    rawName,
    matchedCatalogItem: bestMatch,
    resolvedBrand: bestMatch ? bestMatch.brandName : rawName,
    resolvedGeneric: bestMatch ? bestMatch.genericName : "Unidentified Generic",
    strength: rawStrength || (bestMatch ? bestMatch.strength : ""),
    dose: "1 Tablet",
    frequency: rawFrequency,
    foodTiming,
    durationDays: rawDuration || (isAntibiotic ? 7 : 5),
    confidenceScore: highestScore,
    confidenceLevel,
    isAntibiotic,
    safetyAlerts,
  };
}

export function checkPrescriptionSafety(medicines: ResolvedMedicineResult[]): string[] {
  const alerts: string[] = [];
  const genericsSeen: { [key: string]: string } = {};

  for (const med of medicines) {
    const gen = med.resolvedGeneric.toLowerCase();
    if (gen && gen !== "unidentified generic") {
      if (genericsSeen[gen]) {
        alerts.push(
          `🚨 ডুপ্লিকেট থেরাপি ঝুঁকি: "${med.resolvedBrand}" এবং "${genericsSeen[gen]}" উভয় ওষুধেই "${med.resolvedGeneric}" রয়েছে। অতিরিক্ত মাত্রার ঝুঁকি এড়াতে ডাক্তারের পরামর্শ নিশ্চিত করুন।`
        );
      } else {
        genericsSeen[gen] = med.resolvedBrand;
      }
    }
  }

  return alerts;
}
