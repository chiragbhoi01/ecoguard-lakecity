'use client';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 24.5854,
  lng: 73.7124,
};

const Map = () => {
  const [reports, setReports] = useState([]);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    const fetchReports = async () => {
      const querySnapshot = await getDocs(collection(db, 'reports'));
      const reportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(reportsData);
    };

    fetchReports();
  }, []);

  if (loadError) {
    return <div>Error loading map</div>;
  }

  if (!isLoaded) {
    return <div className='h-full flex items-center justify-center text-white'>Loading Google Maps...</div>;
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
      {reports.map(report => (
        <Marker
          key={report.id}
          position={report.location || { lat: 24.5854, lng: 73.7124 }}
        />
      ))}
    </GoogleMap>
  );
};

export default Map;
