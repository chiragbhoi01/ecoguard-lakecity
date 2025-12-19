'use client';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const StatsOverlay = () => {
  const [stats, setStats] = useState({
    total: 0,
    highSeverity: 0,
    pending: 0,
  });

  useEffect(() => {
    const q = query(collection(db, 'reports'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let total = 0;
      let highSeverity = 0;
      let pending = 0;

      querySnapshot.forEach((doc) => {
        total++;
        if (doc.data().severity === 'High') {
          highSeverity++;
        }
        if (doc.data().status === 'pending') {
          pending++;
        }
      });

      setStats({ total, highSeverity, pending });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className='absolute top-5 left-1/2 transform -translate-x-1/2 z-10 flex gap-4'>
      {/* Total Reports Card */}
      <div className='bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-white shadow-lg flex items-center gap-4'>
        <span className='text-3xl'>📊</span>
        <div>
          <div className='text-sm text-slate-400'>Total Reports</div>
          <div className='text-2xl font-bold'>{stats.total}</div>
        </div>
      </div>

      {/* High Severity Card */}
      <div className='bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-white shadow-lg flex items-center gap-4'>
        <span className='text-3xl'>🚨</span>
        <div>
          <div className='text-sm text-slate-400'>High Risk</div>
          <div className='text-2xl font-bold text-red-500'>{stats.highSeverity}</div>
        </div>
      </div>

      {/* Pending Reports Card */}
      <div className='bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-white shadow-lg flex items-center gap-4'>
        <span className='text-3xl'>⏳</span>
        <div>
          <div className='text-sm text-slate-400'>Pending</div>
          <div className='text-2xl font-bold text-yellow-500'>{stats.pending}</div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverlay;
