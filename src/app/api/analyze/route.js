import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase"; // Using relative path
import logger from "../../../lib/logger"; // Import the logger
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const { image } = await req.json(); // 'image' is expected to be a base64 string

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
    const cleanedResponseText = responseText.replace(/```json\n|\n```/g, '');
    let analysis;
    try {
      analysis = JSON.parse(cleanedResponseText);
    } catch (parseError) {
      logger.error("Failed to parse AI response as JSON:", { parseError, responseText });
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON." },
        { status: 500 }
      );
    }

    // --- UPDATED SAVE TO FIRESTORE LOGIC ---
    let reportId = null;
    try {
      logger.info("Attempting to add document to Firestore", { analysis });
      logger.info("Firestore db object", { db });
      // Create a reference to the 'reports' collection
      const reportsCollection = collection(db, "reports");

      // Use addDoc to save the new data structure
      const docRef = await addDoc(reportsCollection, {
        ...analysis, // Spread the AI result
        imageUrl: "placeholder_image_url",
        location: { lat: 24.5854, lng: 73.7125 }, // Udaipur Coordinates
        status: "pending",
        createdAt: serverTimestamp(),
      });

      reportId = docRef.id;
      logger.info("Document written with ID: ", { reportId });
    } catch (dbError) {
      logger.error("Error adding document to Firestore:", { dbError });
      // reportId remains null if saving fails, but we'll still return the analysis
    }
    // --- END OF FIRESTORE LOGIC ---

    // Update the final response to include the new reportId
    return NextResponse.json(
      { success: true, reportId: reportId, analysis: analysis },
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
