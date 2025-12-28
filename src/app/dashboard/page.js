'use client';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Map from '../../components/Map';
import StatsOverlay from '../../components/StatsOverlay';

const DashboardPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return (
      <div className='h-screen flex flex-col bg-slate-950 items-center justify-center'>
        <h2 className="text-3xl font-semibold text-white animate-pulse">Loading Live Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className='h-screen flex flex-col bg-slate-950'>
      <header className='p-4 bg-slate-900 border-b border-slate-800 z-10'>
        <h1 className='text-white font-bold'>EcoGuard Live Dashboard</h1>
      </header>
      <main className='flex-1 relative'>
        <StatsOverlay reports={reports} />
        <Map reports={reports} />
      </main>
    </div>
  );
};

export default DashboardPage;