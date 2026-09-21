import { NextRequest, NextResponse } from "next/server";
import { extractPrescriptionWithGemini, SAMPLE_PRESETS } from "@/lib/ai/gemini-ocr";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, presetKey, mimeType } = body;

    if (presetKey && SAMPLE_PRESETS[presetKey]) {
      // User selected a quick test preset
      return NextResponse.json({
        success: true,
        data: SAMPLE_PRESETS[presetKey],
      });
    }

    if (!imageBase64) {
      // Default to fever_gastric preset if no image provided
      return NextResponse.json({
        success: true,
        data: SAMPLE_PRESETS.fever_gastric,
      });
    }

    const extraction = await extractPrescriptionWithGemini(imageBase64, mimeType || "image/jpeg");
    return NextResponse.json({
      success: true,
      data: extraction,
    });
  } catch (error: any) {
    console.error("AI extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract prescription",
        fallback: SAMPLE_PRESETS.fever_gastric,
      },
      { status: 500 }
    );
  }
}
