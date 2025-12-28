'use client';
import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Crown, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, orderBy('points', 'desc'), limit(5));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching top users: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getRankIcon = (rank) => {
        switch (rank) {
            case 0: return <Crown size={24} className="text-yellow-400" />;
            case 1: return <Medal size={24} className="text-gray-300" />;
            case 2: return <Award size={24} className="text-yellow-600" />;
            default: return <span className="text-slate-400 font-semibold">{rank + 1}</span>;
        }
    };
    
    const getRankBorder = (rank) => {
        switch (rank) {
            case 0: return 'border-yellow-400 shadow-yellow-400/20';
            case 1: return 'border-gray-300 shadow-gray-300/20';
            case 2: return 'border-yellow-600 shadow-yellow-600/20';
            default: return 'border-slate-700';
        }
    }

    if (loading) {
        return (
            <div className="w-full max-w-lg mx-auto mt-8">
                 <div className="animate-pulse bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="h-8 bg-slate-700 rounded w-3/4 mx-auto mb-6"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                             <div key={i} className="h-16 bg-slate-800 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto mt-12">
            <h2 className="text-2xl font-bold text-center text-slate-700 mb-6">🏆 Top Eco-Warriors</h2>
            <div className="space-y-3">
                {users.map((user, index) => (
                    <div
                        key={user.id}
                        className={`bg-white/60 backdrop-blur-md border ${getRankBorder(index)} shadow-lg rounded-2xl p-4 flex items-center transition-all duration-300 hover:shadow-xl hover:scale-105`}
                        style={{ animation: `slide-in 0.5s ease-out ${index * 0.1}s forwards`, opacity: 0 }}
                    >
                        <div className="w-12 text-center mr-4">{getRankIcon(index)}</div>
                        <img
                            src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`}
                            alt={user.displayName}
                            className="w-12 h-12 rounded-full mr-4 border-2 border-white"
                        />
                        <div className="flex-grow">
                            <p className="font-bold text-slate-800">{user.displayName}</p>
                        </div>
                        <div className="bg-green-100 text-green-800 font-bold text-lg px-4 py-2 rounded-full">
                            {user.points || 0}
                        </div>
                    </div>
                ))}
            </div>
             <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}} />
        </div>
    );
};

export default Leaderboard;
