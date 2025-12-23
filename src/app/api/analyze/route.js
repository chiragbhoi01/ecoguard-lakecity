import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";

// Safety: Agar logger file nahi hai toh console use karega
let logger = console;
try {
  logger = require("../../../lib/logger").default || console;
} catch {
  console.log("Logger file not found, using console.");
}

export async function POST(req) {
  try {
    logger.info("POST request received at /api/analyze");

    // 1. Check API Key
    if (!process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error("API Key is missing in server environment");
    }

    // Support both env variable names just in case
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 2. Parse Request
    const body = await req.json();
    const { image, location } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }

    // 3. Initialize Gemini (Using 2.0 Flash as per your working code)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = 'Analyze this image. Identify if it contains waste/garbage. Return a strict JSON object: { "isWaste": boolean, "wasteType": "Plastic"|"Organic"|"Construction"|"Mixed"|"None", "severity": "Low"|"Medium"|"High", "description": "Short summary" }. Do not use Markdown formatting in the response.';

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: "image/jpeg", data: image } }
        ]
      }]
    });

    const responseText = result.response.text();
    const cleanedResponseText = responseText.replace(/```json\n|\n```/g, "").trim();
    const analysis = JSON.parse(cleanedResponseText);

    let reportId = null;
    if (analysis.isWaste) {
      // Save to Firestore
      const reportsCollection = collection(db, "reports");
      const docRef = await addDoc(reportsCollection, {
        ...analysis,
        imageUrl: "placeholder_image_url",
        location: location || { lat: 24.5854, lng: 73.7125 },
        status: "pending",
        createdAt: serverTimestamp(),
        reportedBy: "user_chirag", // ✅ Hardcoded User (Safe for Demo)
      });
      reportId = docRef.id;

      // Points Logic
      const userRef = doc(db, "users", "user_chirag");
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, { points: increment(10) });
      } else {
        await setDoc(userRef, {
          name: "Chirag Bhoi",
          points: 10,
          avatar: "😎",
          joinedAt: serverTimestamp(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      reportId: reportId,
      analysis: analysis,
      pointsAwarded: analysis.isWaste ? 10 : 0,
    });

  } catch (error) {
    console.error("❌ API ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}