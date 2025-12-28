'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserAuth } from '../../context/AuthContext';
import { LayoutDashboard, Map as MapIcon, FileText, Bell, Trash2, Route, Zap, CheckCircle } from 'lucide-react';
import Map from '../../components/Map';

// --- Reusable Components ---

const Sidebar = () => (
  <aside className="bg-slate-900 text-white w-64 h-screen p-4 flex-col hidden md:flex">
    <div className="text-3xl font-bold text-emerald-400 mb-10">
      <Trash2 className="inline-block mr-2" /> EcoGuard
    </div>
    <nav className="flex flex-col space-y-4">
      <a href="#" className="flex items-center p-3 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
        <LayoutDashboard className="mr-3" /> Overview
      </a>
      <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <MapIcon className="mr-3" /> Live Map
      </a>
      <a href="#" className="flex items-center p-3 rounded-lg hover:bg-slate-800 transition-colors">
        <FileText className="mr-3" /> Reports
      </a>
    </nav>
    <div className="mt-auto text-xs text-slate-500">
      <p>&copy; 2025 EcoGuard Smart City</p>
    </div>
  </aside>
);

const StatCard = ({ title, value, badge, icon, color }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 sm:p-6 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
            {badge && <p className={`text-xs mt-1 font-semibold ${badge.color}`}>{badge.text}</p>}
        </div>
        <div className={`p-3 sm:p-4 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

const ReportItem = ({ report, onProofUpload, isUploading }) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onProofUpload(file, report);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center p-4 bg-slate-800/60 rounded-lg transition-colors gap-4">
      <img src={report.imageUrl} alt="Waste" className="w-full md:w-24 h-auto md:h-24 rounded-md object-cover" />
      <div className="flex-grow w-full">
        <p className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ${report.wasteType === 'Plastic' ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{report.wasteType}</p>
        <p className="text-xs text-slate-400 mt-1">{new Date(report.createdAt?.toDate()).toLocaleString()}</p>
        <p className="text-sm text-slate-300">Severity: {report.severity}</p>
      </div>
      <div className="flex items-center w-full md:w-auto mt-4 md:mt-0">
        {report.status === 'cleaned' ? (
          <div className="text-right w-full">
            <p className="text-emerald-400 font-semibold flex items-center justify-center md:justify-end">
              <CheckCircle className="mr-2" size={18} /> Cleaned & Verified
            </p>
            {report.cleanedImageUrl && (
              <a href={report.cleanedImageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">View Proof</a>
            )}
          </div>
        ) : isUploading ? (
          <p className="text-amber-400 animate-pulse w-full text-center">Verifying...</p>
        ) : (
          <>
            <label htmlFor={`proof-upload-${report.id}`} className="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold flex items-center justify-center w-full md:w-auto text-center">
              📸 Upload Proof to Clean
            </label>
            <input
              id={`proof-upload-${report.id}`}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </>
        )}
      </div>
    </div>
  );
};



const AccessDenied = () => (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl md:text-5xl font-bold text-red-500 mb-4">🚫 Access Denied</h1>
        <p className="text-lg md:text-xl text-slate-400">You do not have permission to view this page.</p>
    </div>
);


// --- Main Admin Page Component ---

const AdminDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const { user, loading: userLoading } = UserAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const [uploadingReportId, setUploadingReportId] = useState(null);
  
  const ALLOWED_EMAILS = ['officalmarshal@gmail.com'];

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (ALLOWED_EMAILS.includes(user.email)) {
      setIsAuthorized(true);
    } else {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!isAuthorized) return;
    
    const reportsCollection = collection(db, 'reports');
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportsData);
      setDataLoading(false);
    }, (error) => {
      console.error("Error fetching reports: ", error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleProofUpload = async (file, report) => {
    if (!file || !user) return;

    setUploadingReportId(report.id);
    const storage = getStorage();
    const storageRef = ref(storage, `cleaned_proofs/${report.id}`);

    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const reportRef = doc(db, 'reports', report.id);
      await updateDoc(reportRef, {
        status: 'cleaned',
        cleanedImageUrl: downloadURL,
      });

      // Atomically increment user points
      // This assumes you have a 'users' collection where each document ID is the user's UID
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: increment(20)
      });

      alert('Cleaned & Verified! +20 Points');

    } catch (error) {
      console.error("Error uploading proof: ", error);
      alert('Error verifying. Please try again.');
    } finally {
      setUploadingReportId(null);
    }
  };
  
  if (userLoading || (isAuthorized && dataLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h2 className="text-3xl font-semibold animate-pulse">Loading Smart City Dashboard...</h2>
      </div>
    );
  }
  
  if (!isAuthorized) {
      return <AccessDenied />;
  }

  const pendingReports = reports.filter(r => r.status !== 'cleaned');
  const cleanedReports = reports.filter(r => r.status === 'cleaned');

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-white">
      <Sidebar />
      
      {/* Mobile Header */}
      <header className="p-4 bg-slate-900 text-xl font-bold text-emerald-400 md:hidden flex items-center justify-between">
          <div className="flex items-center">
            <Trash2 className="inline-block mr-3" /> EcoGuard Admin
          </div>
          {/* You can add a menu button here later */}
      </header>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <StatCard title="Active Alerts" value={pendingReports.length} badge={{ text: "Pending action", color: "text-red-400" }} icon={<Bell size={24} />} color="bg-red-500/20" />
            <StatCard title="Cleaned Reports" value={cleanedReports.length} badge={{ text: "Total verified", color: "text-green-400" }} icon={<CheckCircle size={24} />} color="bg-green-500/20" />
            <StatCard title="Route Efficiency" value="91.5%" icon={<Route size={24} />} color="bg-blue-500/20" />
            <StatCard title="Carbon Saved" value="2.8 t CO2e" icon={<Zap size={24} />} color="bg-yellow-500/20" />
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
             <h2 className="text-xl font-bold text-white mb-4">Citywide Collection Map</h2>
             <div className="h-64 md:h-96 rounded-lg overflow-hidden">
                <Map reports={reports} />
             </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Action Required</h2>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {pendingReports.length > 0 ? (
                    pendingReports.map(report => (
                        <ReportItem 
                            key={report.id} 
                            report={report} 
                            onProofUpload={handleProofUpload}
                            isUploading={uploadingReportId === report.id} 
                        />
                    ))
                ) : (
                    <p className="text-slate-400 text-center mt-4">No pending reports. Great job!</p>
                )}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 md:p-6 rounded-2xl shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4">Recently Cleaned</h2>
                 <div className="space-y-4 overflow-y-auto pr-2 max-h-96">
                    {cleanedReports.length > 0 ? (
                        cleanedReports.slice(0, 10).map(report => (
                           <ReportItem 
                                key={report.id} 
                                report={report} 
                            />
                        ))
                    ) : (
                         <p className="text-slate-400 text-center mt-4">No reports cleaned yet.</p>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
