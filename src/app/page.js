"use client";
import { useState, useEffect, useRef } from "react";
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserAuth } from "../context/AuthContext";
import { Camera, LogOut, Award, Recycle } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

// --- Reusable Components ---

const Header = ({ user, points, onLogout }) => (
    <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <h1 className="text-2xl font-bold text-green-700">EcoGuard</h1>
        {user && (
            <div className="flex items-center gap-4">
                <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center gap-2 px-4 py-2 text-green-800 font-semibold">
                    <Award size={20} />
                    <span>{points} Points</span>
                </div>
                <button onClick={onLogout} className="p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-md text-slate-700 hover:bg-red-100 transition-colors">
                    <LogOut size={20} />
                </button>
            </div>
        )}
    </header>
);

const ScannerAnimation = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl">
        <div className="relative w-48 h-48">
            <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-50"></div>
            <div className="absolute inset-2 border-2 border-green-400 rounded-full"></div>
            <div className="absolute h-full w-2 bg-gradient-to-t from-transparent to-green-400 animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm font-semibold">
                Scanning...
            </div>
        </div>
    </div>
);

// --- Main Home Page Component ---

export default function Home() {
    const { user, googleSignIn, logOut } = UserAuth();
    const [image, setImage] = useState({ preview: null, data: null });
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const [status, setStatus] = useState({ message: "Take a picture of waste to get started!", type: "info" });
    const [points, setPoints] = useState(0);
    const [lastWasteType, setLastWasteType] = useState('None');
    const fileInputRef = useRef(null);

    // Get User Location & Listen for Points
    useEffect(() => {
        if (user) {
            // Geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                    () => setStatus({ message: "Could not fetch location. Please enable it.", type: "error" })
                );
            }
            // Firestore real-time listener
            const userRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    setPoints(doc.data().points || 0);
                    setLastWasteType(doc.data().lastWasteType || 'None');
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage({ preview: URL.createObjectURL(file), data: reader.result.split(",")[1] });
                // Automatically trigger analysis after selecting an image
                analyzeImage(reader.result.split(",")[1], URL.createObjectURL(file));
            };
            reader.onerror = () => setStatus({ message: "❌ Error reading file.", type: "error" });
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async (imageData, imagePreview) => {
        if (!imageData) return setStatus({ message: "Please upload an image first!", type: "error" });
        if (!location) return setStatus({ message: "Waiting for location... please allow permissions.", type: "error" });
        if (!user) return setStatus({ message: "You must be logged in to analyze images.", type: "error" });

        setLoading(true);
        setStatus({ message: "Analyzing waste...", type: "info" });
        // Set preview immediately for the scanning animation
        setImage({ preview: imagePreview, data: imageData });

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: imageData, location, userId: user.uid, userName: user.displayName }),
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                setStatus({ message: `✅ Analysis Complete: ${data.analysis.wasteType} Detected! +${data.analysis.points} Points!`, type: "success" });
            } else {
                setStatus({ message: `❌ Error: ${data.error || "Analysis failed. Try again."}`, type: "error" });
            }
        } catch (error) {
            setStatus({ message: `❌ Network Error: ${error.message}`, type: "error" });
        } finally {
            setLoading(false);
            // Clear image after analysis to be ready for the next one
            setTimeout(() => {
                setImage({ preview: null, data: null });
                setStatus({ message: "Ready for the next scan!", type: "info" });
            }, 5000);
        }
    };
    
    // Trigger file input click
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-white flex flex-col items-center justify-center text-center p-4">
                 <h1 className="text-5xl font-bold text-green-800 mb-4">Welcome to EcoGuard</h1>
                 <p className="text-slate-600 text-lg mb-8">Sign in to start protecting the environment.</p>
                 <button onClick={googleSignIn} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    Sign in with Google
                 </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white font-sans">
            <Header user={user} points={points} onLogout={logOut} />
            <main className="flex flex-col items-center justify-center min-h-screen pt-20 pb-10 px-4">
                
                {/* Hero Section */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-slate-800">Clean Your City, Earn Rewards</h2>
                    <p className="text-slate-500 mt-2">AI-powered waste segregation at your fingertips.</p>
                </div>
                
                {/* Main Action Card */}
                <div className="relative w-full max-w-lg">
                    <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-3xl border border-white/50 p-8">
                        <div className="flex flex-col items-center justify-center h-80">
                           {image.preview ? (
                                <img src={image.preview} alt="Waste Preview" className="w-full h-full object-cover rounded-2xl shadow-inner" />
                            ) : (
                                <>
                                    <button onClick={handleUploadClick} className="relative flex items-center justify-center w-40 h-40 rounded-full bg-green-500 text-white shadow-lg shadow-green-500/50 hover:bg-green-600 transition-all transform hover:scale-110 focus:outline-none">
                                        <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse"></div>
                                        <Camera size={64} className="relative"/>
                                    </button>
                                    <p className="mt-6 text-slate-600">Tap to scan waste</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                         {loading && <ScannerAnimation />}
                    </div>
                </div>

                {/* Status & Impact Section */}
                 <div className="mt-8 text-center w-full max-w-lg">
                     {status.message && (
                         <div className={`p-4 rounded-xl text-sm font-medium ${status.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                             {status.message}
                         </div>
                     )}
                     <div className="mt-4 grid grid-cols-2 gap-4 text-left">
                         <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 rounded-full"><Award size={20} className="text-yellow-600" /></div>
                            <div>
                                <p className="text-sm text-slate-500">Your Points</p>
                                <p className="font-bold text-lg text-slate-700">{points}</p>
                            </div>
                         </div>
                         <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-full"><Recycle size={20} className="text-purple-600" /></div>
                            <div>
                                <p className="text-sm text-slate-500">Last Cleaned</p>
                                <p className="font-bold text-lg text-slate-700">{lastWasteType}</p>
                            </div>
                         </div>
                     </div>
                 </div>
                 <Leaderboard />
            </main>
        </div>
    );
}
