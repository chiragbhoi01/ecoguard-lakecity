'use client';
import { useState, useEffect, useRef } from 'react';
import { UserAuth } from "../context/AuthContext";
import { Camera, LogOut, Award, Star, Gift } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

// --- Reusable Components ---
const Header = ({ onLogout }) => (
    <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <h1 className="text-2xl font-bold text-emerald-600">EcoGuard</h1>
        {onLogout &&
            <button onClick={onLogout} className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 transition-colors">
                <LogOut size={20} />
            </button>
        }
    </header>
);

const BentoCard = ({ children, className = '' }) => (
    <div className={`bg-white/70 backdrop-blur-xl shadow-lg rounded-3xl p-6 border border-white/50 ${className}`}>
        {children}
    </div>
);

// --- Main Home Page Component ---
export default function Home() {
    const { user, googleSignIn, logOut } = UserAuth();
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => setLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => toast.error("Could not fetch location. Please enable it.")
            );
        }
    }, []);

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Image = reader.result.split(',')[1];
                analyzeImage(base64Image);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const analyzeImage = async (imageData) => {
        if (!user) {
            toast.error("You must be logged in to report waste.");
            return;
        }

        setLoading(true);
        const promise = fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: imageData,
                location,
                userId: user.uid, // Task 1: Explicitly add userId
                userName: user.displayName, // Task 1: Explicitly add userName
            }),
        });

        toast.promise(promise, {
            loading: '🤖 AI Identifying Waste...',
            success: (res) => {
                if (!res.ok) throw new Error('Analysis failed.');
                return '♻️ Report Submitted! Points awarded.';
            },
            error: 'Analysis failed. Please try again.',
        });

        try {
            await promise;
        } catch (error) {
            // Errors are handled by toast.promise
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = () => {
        Swal.fire({
            title: 'Redeemed!',
            html: `...`, // Keeping it short for brevity
            confirmButtonText: 'Awesome!',
        });
    };

    if (!user) {
        return (
          <div className="min-h-screen bg-white text-gray-800 flex flex-col">
              <Toaster position="top-center" />
              <Header />
              <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <h1 className="text-6xl font-extrabold text-emerald-600 mb-4">Turn Waste into Wealth.</h1>
                  <p className="text-gray-500 text-xl mb-8 max-w-2xl">Join millions making the planet greener. One scan at a time.</p>
                  <button onClick={googleSignIn} className="bg-emerald-500 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:scale-105">
                      Sign in with Google
                  </button>
              </main>
          </div>
      );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Toaster position="top-center" />
            <Header onLogout={logOut} />
            <main className="container mx-auto px-4 py-24">
                 <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">Welcome, {user.displayName || 'User'}</h2>
                    <div className="bg-green-100 text-green-800 text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                        <Award size={16} /> 450 Eco Points
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <BentoCard className="lg:col-span-2 row-span-2 flex items-center justify-center bg-green-50">
                        <button onClick={handleUploadClick} disabled={loading} className="relative group flex flex-col items-center justify-center w-64 h-64 rounded-full bg-green-500 text-white shadow-2xl shadow-green-500/50 transition-all transform focus:outline-none disabled:bg-green-400 disabled:scale-100">
                            <span className={`absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${loading ? '' : 'animate-ping'}`}></span>
                            <Camera size={80} className="relative mb-2 transition-transform duration-300 group-hover:scale-110" />
                            <span className="text-2xl font-bold relative">TAP TO SCAN</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" capture="environment" />
                    </BentoCard>

                    <BentoCard>
                        <h3 className="font-bold text-gray-700 mb-3">Recent Activity</h3>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl"><Star size={20} className="text-blue-500" /></div>
                            <div>
                                <p className="font-semibold text-gray-800">Plastic Bottle</p>
                                <p className="text-sm text-green-600 font-bold">+20 pts</p>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard>
                        <h3 className="font-bold text-gray-700 mb-4">Top Scanners</h3>
                         <ul className="space-y-3">
                            <li className="flex items-center gap-3"><Star size={16} className="text-yellow-400 fill-yellow-400" /> Mohit Sharma <span className="ml-auto font-semibold">1250 pts</span></li>
                            <li className="flex items-center gap-3"><Star size={16} className="text-gray-400 fill-gray-400" /> Antima Soni <span className="ml-auto font-semibold">980 pts</span></li>
                            <li className="flex items-center gap-3"><Star size={16} className="text-orange-400 fill-orange-400" /> Rahul Meena <span className="ml-auto font-semibold">760 pts</span></li>
                            <li className="flex items-center gap-3"><Star size={16} className="text-pink-400 fill-pink-400" /> Priya Singh <span className="ml-auto font-semibold">520 pts</span></li>
                        </ul>
                    </BentoCard>

                    <BentoCard className="lg:col-span-3">
                         <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-700">Redeem Your Points</h3>
                                <p className="text-sm text-gray-500">Cash in your hard work for real rewards (e.g., Paytm/UPI vouchers).</p>
                            </div>
                            <button onClick={handleRedeem} className="bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-600 transition-all transform hover:scale-105">
                                <Gift size={16} className="inline mr-2" />
                                Redeem Points
                            </button>
                        </div>
                    </BentoCard>
                </div>
            </main>
        </div>
    );
}