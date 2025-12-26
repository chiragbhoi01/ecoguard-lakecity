'use client';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { UserAuth } from '../../context/AuthContext';
import { LayoutDashboard, Map as MapIcon, FileText, Bell, Trash2, Route, Zap } from 'lucide-react';
import Map from '../../components/Map';

// --- Reusable Components ---

const Sidebar = () => (
  <aside className="bg-slate-900 text-white w-64 min-h-screen p-4 flex flex-col">
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
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {badge && <p className={`text-xs mt-1 font-semibold ${badge.color}`}>{badge.text}</p>}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
    </div>
);

const ReportItem = ({ report }) => (
    <div className="flex items-center p-3 bg-slate-800/60 rounded-lg hover:bg-slate-700/80 transition-colors">
        <img src={report.imageUrl} alt="Waste" className="w-12 h-12 rounded-md object-cover mr-4" />
        <div className="flex-grow">
            <p className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block ${report.wasteType === 'Plastic' ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{report.wasteType}</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(report.createdAt?.toDate()).toLocaleTimeString()}</p>
        </div>
    </div>
);


const BarChartPlaceholder = () => (
    <div className="h-full flex items-end space-x-2">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex-1 bg-emerald-500/50 rounded-t-md" style={{ height: `${Math.random() * 80 + 10}%` }}></div>
      ))}
    </div>
);

const PieChartPlaceholder = () => (
    <div className="w-48 h-48 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#10B981 0% 45%, #F59E0B 45% 75%, #3B82F6 75% 90%, #EF4444 90% 100%)' }}>
       <div className="w-24 h-24 bg-slate-800 rounded-full"></div>
    </div>
);


// --- Main Admin Page Component ---

const AdminDashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = UserAuth();

  useEffect(() => {
    if (!user) return;
    
    const reportsCollection = collection(db, 'reports');
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reports: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h2 className="text-3xl font-semibold animate-pulse">Loading Smart City Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Active Alerts" value="18" badge={{ text: "+4 today", color: "text-red-400" }} icon={<Bell size={24} />} color="bg-red-500/20" />
            <StatCard title="Bins Collected" value="1,246" badge={{ text: "+12%", color: "text-green-400" }} icon={<Trash2 size={24} />} color="bg-green-500/20" />
            <StatCard title="Route Efficiency" value="91.5%" icon={<Route size={24} />} color="bg-blue-500/20" />
            <StatCard title="Carbon Saved" value="2.8 t CO2e" icon={<Zap size={24} />} color="bg-yellow-500/20" />
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl shadow-xl">
             <h2 className="text-xl font-bold text-white mb-4">Citywide Collection Map</h2>
             <div className="h-96 rounded-lg overflow-hidden">
                <Map reports={reports} />
             </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Live Reports</h2>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                {reports.slice(0, 10).map(report => (
                    <ReportItem key={report.id} report={report} />
                ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4">Collection Trends</h2>
                <div className="h-64">
                    <BarChartPlaceholder />
                </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4">Waste Composition</h2>
                <div className="h-64 flex items-center justify-center">
                   <PieChartPlaceholder />
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;