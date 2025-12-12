// src/app/page.js
import ImageUpload from "../components/ImageUpload";

export default function Home() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>EcoGuard Application</h1>
      <ImageUpload />
    </main>
  );
}
