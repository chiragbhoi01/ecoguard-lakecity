// src/components/ImageUpload.jsx
"use client";

import { useState } from "react";
// Removed Firebase imports as per new flow

export default function ImageUpload() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [processing, setProcessing] = useState(false); // Renamed from 'uploading' to 'processing'
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      setImagePreview(URL.createObjectURL(selectedImage));
      setError(null);
      setAnalysisResult(null);
    } else {
      setImage(null);
      setImagePreview(null);
      setAnalysisResult(null);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Get base64 string part
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAnalyze = async () => { // Renamed from 'handleUpload' to 'handleAnalyze'
    if (!image) {
      setError("Please select an image to analyze.");
      return;
    }

    setProcessing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const base64Image = await convertToBase64(image);

      // Call the /api/analyze endpoint with base64 image data
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64Image }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.success) {
        setAnalysisResult(analyzeData.analysis);
        alert("Image analyzed successfully!");
      } else {
        setError(analyzeData.error || "Failed to analyze image.");
      }
    } catch (err) {
      console.error("Error during analysis:", err);
      setError("Failed to process image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "500px", margin: "auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Upload Image for Analysis</h2>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "block", margin: "0 auto 20px auto", padding: "10px", border: "1px solid #eee", borderRadius: "4px" }}
      />

      {imagePreview && (
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <img
            src={imagePreview}
            alt="Image Preview"
            style={{ maxWidth: "100%", maxHeight: "300px", border: "1px solid #ddd", borderRadius: "4px" }}
          />
        </div>
      )}

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <button
        onClick={handleAnalyze}
        disabled={!image || processing}
        style={{
          display: "block",
          margin: "0 auto",
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: (!image || processing) ? "not-allowed" : "pointer",
          opacity: (!image || processing) ? 0.6 : 1,
        }}
      >
        {processing ? "Analyzing..." : "Analyze Image"}
      </button>

      {analysisResult && (
        <div style={{ marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          <h3 style={{ textAlign: "center" }}>Analysis Result:</h3>
          <pre style={{ whiteSpace: "pre-wrap", border: "1px solid #ddd", padding: "10px", borderRadius: "4px", backgroundColor: "#f9f9f9", textAlign: "left" }}>
            {JSON.stringify(analysisResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}