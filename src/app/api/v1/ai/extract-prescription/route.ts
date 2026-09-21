import { NextRequest, NextResponse } from "next/server";
import { extractPrescriptionWithGemini } from "@/lib/ai/gemini-ocr";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body. Please upload a prescription image." },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No prescription image provided. Please select or capture a prescription image to scan." 
        },
        { status: 400 }
      );
    }

    // Run real Gemini 3.6 Flash Vision OCR
    const extraction = await extractPrescriptionWithGemini(imageBase64, mimeType || "image/jpeg");

    return NextResponse.json({
      success: true,
      data: extraction,
    });
  } catch (error: any) {
    console.error("Real Gemini OCR error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to extract prescription with Gemini AI.",
      },
      { status: 500 }
    );
  }
}
