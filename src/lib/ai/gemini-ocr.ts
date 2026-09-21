import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { resolveMedicine, checkPrescriptionSafety, type ResolvedMedicineResult } from "../safety/medicine-resolver";

export const ExtractedMedicineItemSchema = z.object({
  rawName: z.string(),
  strength: z.string().optional(),
  dose: z.string().default("1 Tablet"),
  frequency: z.string().default("1+0+1"),
  timing: z.enum(["BEFORE_FOOD", "AFTER_FOOD", "EMPTY_STOMACH", "WITH_FOOD", "AS_NEEDED"]).default("AFTER_FOOD"),
  durationDays: z.number().default(5),
  instructions: z.string().optional(),
});

export const PrescriptionExtractSchema = z.object({
  doctorName: z.string().default("Unspecified Doctor"),
  hospitalName: z.string().default("Unspecified Clinic / Hospital"),
  prescriptionDate: z.string().default(new Date().toISOString().split("T")[0]),
  medicines: z.array(ExtractedMedicineItemSchema),
});

export type ExtractedMedicineItem = z.infer<typeof ExtractedMedicineItemSchema>;
export type PrescriptionExtractResult = z.infer<typeof PrescriptionExtractSchema>;

export interface FullProcessedPrescription {
  doctorName: string;
  hospitalName: string;
  prescriptionDate: string;
  medicines: ResolvedMedicineResult[];
  safetyAlerts: string[];
}

export async function extractPrescriptionWithGemini(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<FullProcessedPrescription> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured in .env. Please provide a valid Gemini API key.");
  }

  if (!imageBase64 || imageBase64.trim() === "") {
    throw new Error("No image data provided. Please upload or capture a prescription image.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Use gemini-3.6-flash (current verified active flash model for this key)
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const prompt = `
You are an expert medical prescription document OCR and structured data extractor for MediFlow BD (Bangladesh).
Extract structured prescription details from this image.
Strict Extraction Boundary:
- You are ONLY an OCR extractor. Do NOT diagnose illnesses or recommend new medicines.
- Identify Doctor Name, Hospital/Clinic Name, Date, and list of prescribed medicines.
- For each medicine, extract:
  * rawName: Brand or generic name exactly as written (e.g. Napa, Seclo, Ciprocin, Sergel, Monas, Ace, Fexo)
  * strength: e.g. "500 mg", "20 mg", "10 mg"
  * dose: e.g. "1 Tablet", "1 Capsule", "2 Teaspoon"
  * frequency: Standard Bangladesh dosage format (e.g. "1+0+1", "1+1+1", "1+0+0", "0+0+1", "0+1+0")
  * timing: ONE OF ("BEFORE_FOOD", "AFTER_FOOD", "EMPTY_STOMACH", "WITH_FOOD", "AS_NEEDED")
  * durationDays: Integer number of days (e.g. 5, 7, 14, 30)
  * instructions: Any special usage advice in Bengali or English

Output STRICTLY valid JSON conforming to this schema without any markdown wrapping:
{
  "doctorName": "string",
  "hospitalName": "string",
  "prescriptionDate": "YYYY-MM-DD",
  "medicines": [
    {
      "rawName": "string",
      "strength": "string",
      "dose": "string",
      "frequency": "1+0+1",
      "timing": "AFTER_FOOD",
      "durationDays": 5,
      "instructions": "string"
    }
  ]
}
`;

  const cleanData = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const imagePart = {
    inlineData: {
      data: cleanData,
      mimeType: mimeType,
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const responseText = result.response.text();
  
  // Strip code fences if present
  const cleanJson = responseText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(cleanJson);
  } catch (parseErr) {
    throw new Error(`Failed to parse Gemini response as JSON: ${cleanJson.substring(0, 200)}`);
  }

  const validated = PrescriptionExtractSchema.parse(parsedJson);

  if (!validated.medicines || validated.medicines.length === 0) {
    throw new Error("No medicines could be clearly detected in this prescription image. Please ensure the image is clear and well-lit.");
  }

  // Resolve against verified Bangladesh Medicine Database
  const resolvedMedicines: ResolvedMedicineResult[] = validated.medicines.map((m) =>
    resolveMedicine(m.rawName, m.strength, m.frequency, m.timing, m.durationDays)
  );

  // Deterministic rule checks (Duplicate therapy, antibiotic course)
  const safetyAlerts = checkPrescriptionSafety(resolvedMedicines);

  return {
    doctorName: validated.doctorName,
    hospitalName: validated.hospitalName,
    prescriptionDate: validated.prescriptionDate,
    medicines: resolvedMedicines,
    safetyAlerts,
  };
}
