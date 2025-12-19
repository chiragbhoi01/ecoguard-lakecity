"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const UploadIcon = () => (
  <svg className="w-12 h-12 mb-4 text-slate-400 group-hover:text-green-400 transition-colors" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
    <title>Upload Icon</title>
    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
  </svg>
);

const Loader = () => (
  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
    <title>Loading Spinner</title>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function Home() {
  const [image, setImage] = useState({ preview: null, data: null });
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState({ message: "", type: "" });

  // Get User Location on Load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting location:", error)
      );
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ preview: URL.createObjectURL(file), data: reader.result.split(",")[1] });
      };
      reader.onerror = () => {
        setStatus({ message: "❌ Error reading file.", type: "error" });
      }
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image.data) return setStatus({ message: "Please upload an image first!", type: "error" });
    if (!location) return setStatus({ message: "Waiting for location... please allow permissions.", type: "error" });

    setLoading(true);
    setStatus({ message: "Analyzing waste...", type: "info" });

    try {
      // Send to API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: image.data,
          location: location,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success && data.result) {
        // Fallback for previous API structure if it returned result directly? 
        // Logic in route.js returns { success: true, analysis: ... } now.
        // Let's adjust to handle 'analysis' or 'result' just in case.
        setStatus({ message: `✅ Result: ${data.analysis ? data.analysis.wasteType : data.result}`, type: "success" });
      } else if (data.success && data.analysis) {
        setStatus({ message: `✅ Analysis Complete: ${data.analysis.wasteType} Detected`, type: "success" });
      } else {
        // Show specific error from backend
        setStatus({
          message: `❌ Error: ${data.error || "Analysis failed. Try again."}`,
          type: "error"
        });
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setStatus({ message: `❌ Network Error: ${error.message}`, type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Glassmorphism Card */}
      <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">♻️ EcoGuard</h1>
          <p className="text-slate-400 text-sm">AI-Powered Waste Detection System</p>
        </div>

        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer bg-slate-800/30 hover:bg-slate-700/50 hover:border-green-500 transition-all group">

          {image.preview ? (
            <img
              src={image.preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadIcon />
              <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-slate-500">PNG, JPG or GIF</p>
            </div>
          )}
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </label>

        {/* Location Status */}
        <div className="mt-4 flex items-center justify-center space-x-2">
          {location ? (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full flex items-center">
              📍 Location Active
            </span>
          ) : (
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full animate-pulse">
              📡 Detecting Location...
            </span>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={analyzeImage}
          disabled={loading || !location}
          className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all transform active:scale-95 ${loading || !location
              ? "bg-slate-600 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/25 hover:-translate-y-1"
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader />
              Analyzing...
            </span>
          ) : (
            "Analyze Waste 🔍"
          )}
        </button>

        {/* Result Area */}
        {status.message && (
          <div className={`mt-4 p-4 rounded-lg text-center text-sm font-medium ${status.type === "error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-green-500/10 text-green-400 border border-green-500/20"
            }`}>
            {status.message}
          </div>
        )}

      </div>
    </div>
  );
} 