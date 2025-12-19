'use client';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('points', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRankIndicator = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-6 sm:mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          🏆 Eco-Champions Leaderboard
        </h1>

        {loading ? (
          <div className="text-center text-lg">Loading Champions...</div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <ul>
              {users.map((user, index) => (
                <li
                  key={user.id}
                  className={`flex items-center p-4 transition-all duration-300 ${
                    index !== users.length - 1 ? 'border-b border-slate-700' : ''
                  } ${index < 3 ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'}`}
                >
                  <div className="text-2xl font-bold w-16 text-center">{getRankIndicator(index + 1)}</div>
                  <div className="text-4xl mx-4">{user.avatar || '👤'}</div>
                  <div className="flex-1">
                    <div className="text-xl font-semibold">{user.name}</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{user.points} pts</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-transform duration-300 hover:scale-105 inline-block">
              ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
