'use client';

import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { AlertTriangle, MapPin } from 'lucide-react';
import { UserAuth } from '../../context/AuthContext';

// A placeholder icon for when the image URL is not available
const WasteIcon = () => (
  <div className="w-full h-48 bg-slate-700 flex items-center justify-center rounded-t-lg">
    <AlertTriangle className="w-16 h-16 text-slate-500" />
  </div>
);

const AdminDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = UserAuth();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportsCollection = collection(db, 'reports');
        const q = query(reportsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const reportsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(reportsData);
      } catch (error) {
        console.error("Error fetching reports: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const getSeverityBadgeColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const handleViewLocation = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Date not available';
    return timestamp.toDate().toLocaleString();
  };

  const handleResolve = async (reportId) => {
    if (!user) {
      alert('You must be logged in to mark reports as cleaned.');
      return;
    }

    const reportRef = doc(db, 'reports', reportId);
    const userId = user.uid; // Get UID from authenticated user

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <h2 className="text-2xl font-semibold animate-pulse">Loading Reports...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-emerald-400">EcoGuard Control Room</h1>
        <p className="text-slate-400 mt-2">Live reports from AI-powered waste detection units.</p>
      </header>

      <main>
        {reports.length === 0 ? (
          <div className="text-center">
            <p className="text-slate-500">No reports found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-emerald-500/10">
                {report.imageUrl && report.imageUrl !== 'placeholder_image_url' ? (
                  <img src={report.imageUrl} alt={report.description} className="w-full h-48 object-cover" />
                ) : (
                  <WasteIcon />
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityBadgeColor(report.severity)}`}>
                      {report.severity}
                    </span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-700 text-slate-300">
                      {report.wasteType}
                    </span>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-4 h-10 overflow-y-auto">{report.description}</p>

                  <div className="text-xs text-slate-500 mb-4">
                    Reported on: {formatDate(report.createdAt)}
                  </div>
                  
                  <button 
                    onClick={() => handleViewLocation(report.location?.lat, report.location?.lng)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <MapPin size={16} />
                    View Location
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
