import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase"; // Using relative path
import logger from "../../../lib/logger"; // Import the logger
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

export async function POST(req) {
  try {
    console.log("Step 1: POST request received at /api/analyze");

    // 1. Check API Key first
    if (!process.env.GEMINI_API_KEY) {
      console.error("Step 1.1: GEMINI_API_KEY is missing in server environment");
      throw new Error("API Key is missing in server environment");
    }
    console.log("Step 2: API Key found");

    // 2. Parse Request
    const body = await req.json();
    const { image, location } = body;
    console.log("Step 3: Request parsed. Image present?", !!image, "Location:", location);

    if (!image) {
      console.error("Step 3.1: No image data provided");
      return NextResponse.json(
        { success: false, error: "Image data (base64 string) is required" },
        { status: 400 }
      );
    }

    // 3. Initialize Gemini
    console.log("Step 4: Initializing Gemini...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // gemini-1.5-flash was not found, using gemini-2.0-flash from available models
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt =
      'Analyze this image. Identify if it contains waste/garbage. Return a strict JSON object: { "isWaste": boolean, "wasteType": "Plastic"|"Organic"|"Construction"|"Mixed"|"None", "severity": "Low"|"Medium"|"High", "description": "Short summary" }. Do not use Markdown formatting in response.';

    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      },
    ];

    console.log("Step 5: Sending request to Gemini...");
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });
    console.log("Step 6: Gemini response received");

    const response = result.response;
    const responseText = response.text(); // Using .text() is safer/easier
    console.log("Step 7: Raw text from Gemini:", responseText);

    const cleanedResponseText = responseText.replace(/```json\n|\n```/g, "").replace(/```/g, "");

    let analysis;
    try {
      analysis = JSON.parse(cleanedResponseText);
      console.log("Step 8: JSON parsed successfully:", analysis);
    } catch (parseError) {
      console.error("Step 8.1: JSON Parse Error:", parseError);
      throw new Error("Failed to parse AI response: " + responseText);
    }

    let reportId = null;
    if (analysis.isWaste) {
      console.log("Step 9: Waste detected. Saving to Firestore...");
      try {
        const reportsCollection = collection(db, "reports");
        const docRef = await addDoc(reportsCollection, {
          ...analysis,
          imageUrl: "placeholder_image_url",
          location: location || { lat: 24.5854, lng: 73.7125 },
          status: "pending",
          createdAt: serverTimestamp(),
          reportedBy: "user_chirag", // Hardcoded user
        });
        reportId = docRef.id;
        console.log("Step 10: Report saved with ID:", reportId);

        // --- GAMIFICATION LOGIC ---
        const userId = "user_chirag";
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          await updateDoc(userRef, { points: increment(10) });
          console.log("Step 11: User points incremented");
        } else {
          await setDoc(userRef, {
            name: "Chirag Bhoi",
            points: 10,
            avatar: "😎",
            joinedAt: serverTimestamp(),
          });
          console.log("Step 11: New user created");
        }
        // --- END GAMIFICATION LOGIC ---
      } catch (dbError) {
        console.error("Step 9.1: Firestore Error:", dbError);
        // We log it but maybe don't want to crash the whole user response if just DB fails? 
        // For now, let's treat it as critical for debugging.
        throw new Error("Firestore Error: " + dbError.message);
      }
    } else {
      console.log("Step 9: No waste detected, skipping Firestore save.");
    }

    return NextResponse.json(
      {
        success: true,
        reportId: reportId,
        analysis: analysis,
        isWaste: analysis.isWaste,
        pointsAwarded: analysis.isWaste ? 10 : 0,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("CRITICAL ERROR during analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown Server Error",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
