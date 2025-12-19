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
    const { image, location } = await req.json(); // 'image' is expected to be a base64 string

    if (!image) {
      logger.error("Image data (base64 string) is required");
      return NextResponse.json(
        { success: false, error: "Image data (base64 string) is required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });

    const prompt =
      'Analyze this image. Identify if it contains waste/garbage. Return a strict JSON object: { "isWaste": boolean, "wasteType": "Plastic"|"Organic"|"Construction"|"Mixed"|"None", "severity": "Low"|"Medium"|"High", "description": "Short summary" }. Do not use Markdown formatting in response.';

    const parts = [
      {
        text: prompt,
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image,
        },
      },
    ];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
    });

    logger.info("Gemini API result", { result });

    const response = result.response;
    const responseText = response.candidates[0].content.parts[0].text;
    const cleanedResponseText = responseText.replace(/```json\n|\n```/g, "");
    let analysis;
    try {
      analysis = JSON.parse(cleanedResponseText);
    } catch (parseError) {
      logger.error("Failed to parse AI response as JSON:", {
        parseError,
        responseText,
      });
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON." },
        { status: 500 }
      );
    }

    let reportId = null;
    if (analysis.isWaste) {
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
        logger.info("Document written with ID: ", { reportId });

        // --- GAMIFICATION LOGIC ---
        const userId = "user_chirag";
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          await updateDoc(userRef, { points: increment(10) });
          logger.info("User points incremented by 10", { userId });
        } else {
          await setDoc(userRef, {
            name: "Chirag Bhoi",
            points: 10,
            avatar: "😎",
            joinedAt: serverTimestamp(),
          });
          logger.info("New user created with 10 points", { userId });
        }
        // --- END GAMIFICATION LOGIC ---
      } catch (dbError) {
        logger.error("Error adding document to Firestore:", { dbError });
      }
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
    logger.error("Error analyzing image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze image." },
      { status: 500 }
    );
  }
}
