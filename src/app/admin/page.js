'use client';
import { useState, useEffect, useRef } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, getDocs, writeBatch, query, orderBy, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Bell, Trash, Leaf, Server, ChevronDown, AlertTriangle, Upload, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import MapComponent from '../../components/Map';

// --- Data Seeding ---
const seedDatabase = async () => {
    try {
        const reportsRef = collection(db, "reports");
        const q = query(reportsRef);
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast.loading('No reports found. Seeding database with 15 mock reports...', { duration: 2000 });
            const batch = writeBatch(db);
            const userLocation = { lat: 23.5461, lng: 74.4350 }; // Banswara, Rajasthan
            const wasteTypes = ['Gutka Packet', 'Amul Milk Pouch', 'Bisleri Bottle', 'Tea Cups'];

            for (let i = 0; i < 15; i++) {
                const docRef = collection(db, 'reports').doc();
                const isPending = Math.random() > 0.3;
                batch.set(docRef, {
                    wasteType: wasteTypes[Math.floor(Math.random() * wasteTypes.length)],
                    severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                    status: isPending ? 'pending' : 'cleaned',
                    createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7)),
                    location: {
                        lat: userLocation.lat + (Math.random() - 0.5) * 0.05, // Smaller deviation for realism
                        lng: userLocation.lng + (Math.random() - 0.5) * 0.05, // Smaller deviation for realism
                    },
                    imageUrl: `https://picsum.photos/seed/${i}/400/300`
                });
            }
            await batch.commit();
            toast.success('Database seeded successfully!');
        }
    } catch (error) {
        toast.error('Failed to seed database.');
    }
};

// --- Reusable Components ---
const Sparkline = ({ data = [5, 10, 15, 12, 18, 20, 17, 22, 25, 23], color = "currentColor" }) => {
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${30 - (d / Math.max(...data)) * 28}`).join(' ');
    return <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points={points} fill="none" stroke={color} strokeWidth="2" /></svg>;
};

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="flex justify-between items-center"><p className="text-sm font-medium text-gray-500">{title}</p><div className={`text-${color}-500`}>{icon}</div></div>
        <p className={`text-3xl font-bold text-${color}-500 mt-2`}>{value}</p>
        <div className="mt-4"><Sparkline color={color === 'gray' ? '#6b7280' : color === 'red' ? '#ef4444' : color === 'green' ? '#22c55e' : '#14b8a6'} /></div>
    </div>
);

const ReportItem = ({ report, onResolve }) => {
    const fileInputRef = useRef(null);
    const handleResolveClick = () => fileInputRef.current?.click();

    return (
        <div className="flex items-center p-3 bg-gray-50 rounded-lg transition-colors">
            <img src={report.imageUrl} alt={report.wasteType} className="w-14 h-14 object-cover rounded-md" />
            <div className="ml-4 flex-grow">
                <p className="font-semibold text-gray-800">{report.wasteType} - Severity: {report.severity}</p>
                <p className="text-sm text-gray-500">{new Date(report.createdAt?.toDate()).toLocaleString()}</p>
            </div>
            {report.status === 'pending' ? (
                <>
                    <button onClick={handleResolveClick} className="ml-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-all transform hover:scale-105">
                        <Upload size={16} className="inline mr-2" />
                        Resolve
                    </button>
                    <input type="file" ref={fileInputRef} onChange={(e) => onResolve(report.id, e.target.files[0])} className="hidden" accept="image/*" />
                </>
            ) : (
                <div className="ml-4 flex items-center text-green-600 font-semibold">
                    <CheckCircle size={20} className="mr-2" /> Cleaned
                </div>
            )}
        </div>
    );
};


const AdminDashboardPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    useEffect(() => {
        seedDatabase().finally(() => setLoading(false));

        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setReports(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => toast.error("Failed to fetch live reports."));

        return () => unsubscribe();
    }, []);

    const handleResolveReport = async (reportId, file) => {
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading('Uploading proof of work...');

        try {
            const reportToResolve = reports.find(r => r.id === reportId);
            if (!reportToResolve) throw new Error("Report not found.");

            const storageRef = ref(storage, `proofs/${reportId}-${file.name}`);
            const uploadResult = await uploadBytes(storageRef, file);
            const proofUrl = await getDownloadURL(uploadResult.ref);

            // Update report status
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, {
                status: 'cleaned',
                proofImageUrl: proofUrl,
            });

            // CRITICAL LOGIC FIX: Credit points to the reporter
            if (reportToResolve.userId) {
                const reporterRef = doc(db, 'users', reportToResolve.userId);
                await updateDoc(reporterRef, { points: increment(50) });
                toast.success(`Success! 50 Points sent to ${reportToResolve.userName || 'the reporter'}.`, { id: toastId });
            } else {
                toast.success('Report resolved, but reporter ID was missing.', { id: toastId });
            }

        } catch (error) {
            toast.error('Failed to resolve report.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const pendingReports = reports.filter(r => r.status === 'pending');
    const resolvedReports = reports.filter(r => r.status === 'cleaned');

    if (loading) {
        return <div className="min-h-screen bg-gray-100/50 flex items-center justify-center"><p>Loading Command Center...</p></div>;
    }

    return (
        <div className={`min-h-screen bg-gray-100/50 ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
            <Toaster position="top-center" />
            <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900">EcoGuard Command Center</h1>
                <div className="flex items-center space-x-6">
                    <span className="text-sm text-gray-600">{currentDate}</span>
                    <div className="flex items-center space-x-3">
                        <img src="https://i.pravatar.cc/40?u=chirag" alt="Admin Avatar" className="w-9 h-9 rounded-full" />
                        <div><p className="font-semibold text-sm">Chirag Bhoi</p><p className="text-xs text-gray-500">Senior Research Analyst</p></div>
                        <ChevronDown size={18} className="text-gray-400 cursor-pointer" />
                    </div>
                </div>
            </header>

            <main className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Active Alerts" value={pendingReports.length} icon={<AlertTriangle size={22} />} color="red" />
                    <StatCard title="Bins Collected" value={resolvedReports.length} icon={<Trash size={22} />} color="green" />
                    <StatCard title="Carbon Saved" value="2.4t" icon={<Leaf size={22} />} color="teal" />
                    <StatCard title="System Status" value="98%" icon={<Server size={22} />} color="gray" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Live Grid Overview & Optimized Route</h2>
                        <div className="h-[60vh] bg-gray-200 rounded-lg">
                            <MapComponent reports={reports} pendingRoute={pendingReports.map(r => r.location)} />
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Live Feed</h2>
                        <div className="space-y-3 h-[60vh] overflow-y-auto">
                            {reports.map((report) => <ReportItem key={report.id} report={report} onResolve={handleResolveReport} />)}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboardPage;
