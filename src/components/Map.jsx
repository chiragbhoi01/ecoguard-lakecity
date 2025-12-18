'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 24.5854,
  lng: 73.7124,
};

const mapOptions = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
    { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

const getMarkerIcon = (report) => {
  if (report.status === 'resolved') {
    return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  }
  switch (report.severity) {
    case 'High':
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    case 'Medium':
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    case 'Low':
      return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    default:
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
};

const Map = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
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

  const handleResolve = async (reportId) => {
    const reportRef = doc(db, 'reports', reportId);
    try {
      await updateDoc(reportRef, {
        status: 'resolved',
        severity: 'Low', // Note: Severity is now 'Low' as it's resolved
      });

      // Optimistic UI update
      setReports(prevReports =>
        prevReports.map(report =>
          report.id === reportId ? { ...report, status: 'resolved', severity: 'Low' } : report
        )
      );
      setSelectedReport(null); // Close InfoWindow
      console.log('Report resolved!');
      alert('Report resolved!');
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('Failed to resolve report.');
    }
  };

  if (loadError) {
    return <div>Error loading map</div>;
  }

  if (!isLoaded) {
    return <div className='h-full flex items-center justify-center text-white'>Loading Google Maps...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={mapOptions}
      onClick={() => setSelectedReport(null)}
    >
      {reports.map(report => (
        <Marker
          key={report.id}
          position={report.location}
          icon={getMarkerIcon(report)}
          onClick={() => setSelectedReport(report)}
        />
      ))}

      {selectedReport && (
        <InfoWindow
          position={selectedReport.location}
          onCloseClick={() => setSelectedReport(null)}
        >
          <div className='p-2 bg-slate-900 text-white rounded-lg shadow-lg'>
            <h3 className='font-bold text-lg mb-2'>{selectedReport.title || 'Waste Report'}</h3>
            <p><span className='font-semibold'>Severity:</span> {selectedReport.severity}</p>
            <p><span className='font-semibold'>Status:</span> {selectedReport.status}</p>
            {selectedReport.description && <p className='mt-2 text-sm'>{selectedReport.description}</p>}
            
            {selectedReport.status !== 'resolved' && (
              <div className='mt-4'>
                <button
                  onClick={() => handleResolve(selectedReport.id)}
                  className='bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg text-sm'
                >
                  ✅ Mark as Cleaned
                </button>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Map;
