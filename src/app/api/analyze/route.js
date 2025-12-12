import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase"; // Using relative path
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req) {
  try {
    const { image } = await req.json(); // 'image' is expected to be a base64 string

    if (!image) {
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

    const responseText = result.response.text();
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("AI Response Text:", responseText);
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON." },
        { status: 500 }
      );
    }

    // --- ADDING SAVE TO FIRESTORE LOGIC ---
    let dbSaved = false;
    try {
      const docRef = await addDoc(collection(db, "reports"), {
        wasteType: analysis.wasteType,
        severity: analysis.severity,
        description: analysis.description,
        imageUrl: "placeholder_for_now", // As requested
        status: "pending",
        timestamp: serverTimestamp(),
      });
      console.log("Document written with ID: ", docRef.id);
      dbSaved = true;
    } catch (dbError) {
      console.error("Error adding document to Firestore:", dbError);
      // We will still return the analysis, but indicate DB save failed.
      dbSaved = false;
    }
    // --- END OF FIRESTORE LOGIC ---

    return NextResponse.json(
      { success: true, analysis: analysis, dbSaved: dbSaved },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze image." },
      { status: 500 }
    );
  }
}
