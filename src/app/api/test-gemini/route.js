import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      "Write a one-line slogan for a Smart City Waste Management Hackathon project.";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    return new Response(JSON.stringify({ success: true, slogan: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating slogan:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to generate slogan" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
