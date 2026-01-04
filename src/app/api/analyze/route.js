import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db, storage } from "../../../lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
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

// Helper function for retrying the Gemini API call
async function generateWithRetry(model, prompt, image, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType: "image/jpeg", data: image } },
      ]);
      return result;
    } catch (error) {
      // Check if the error is a 429 or 503
      const isRateLimitError = error.message.includes('429') || error.message.includes('503');
      if (isRateLimitError && i < retries - 1) {
        logger.warn(`Attempt ${i + 1} failed with rate limit error. Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to get a response from the model after multiple retries.");
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
    const { image, location, userId, userName } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "Image data is required" },
        { status: 400 }
      );
    }
    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, error: "User information is required" },
        { status: 401 }
      );
    }

    // 3. Initialize Gemini (Using 2.0 Flash as per your working code)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = 'Analyze this image. Identify if it contains waste/garbage. Return a strict JSON object: { "isWaste": boolean, "wasteType": "Plastic"|"Organic"|"Construction"|"Mixed"|"None", "severity": "Low"|"Medium"|"High", "description": "Short summary" }. Do not use Markdown formatting in the response.';

    const result = await generateWithRetry(model, prompt, image);

    const responseText = result.response.text();
    const cleanedResponseText = responseText.replace(/```json\n|\n```/g, "").trim();
    const analysis = JSON.parse(cleanedResponseText);

    let reportId = null;
    if (analysis.isWaste) {
      // 1. Upload Image to Storage
      const storageRef = ref(storage, 'reports/' + Date.now() + '.jpg');
      await uploadString(storageRef, image, 'base64');
      const imageUrl = await getDownloadURL(storageRef);

      // 2. Save Report to Firestore
      const reportsCollection = collection(db, "reports");
      const docRef = await addDoc(reportsCollection, {
        ...analysis,
        imageUrl: imageUrl, // Use the real URL
        location: location || { lat: 24.5854, lng: 73.7125 },
        status: "pending",
        createdAt: serverTimestamp(),
        userId: userId, // Fix: Use userId as requested
        userName: userName,
      });
      reportId = docRef.id;

      // Points Logic
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        await updateDoc(userRef, { points: increment(10) });
      } else {
        await setDoc(userRef, {
          name: userName,
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