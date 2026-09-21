import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing with API Key:", apiKey ? apiKey.substring(0, 8) + "..." : "NONE");
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello, respond with 'OK' if you can read this.");
    console.log("Gemini Response:", result.response.text());
  } catch (err: any) {
    console.error("Gemini Test Error:", err.message);
  }
}

test();
