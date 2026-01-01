'use client';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import Polyline from './Polyline';
import { useState, useCallback, useEffect } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const BANSWARA_COORDS = { lat: 23.5461, lng: 74.4350 };

const mapOptions = {
    styles: [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.arterial', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
        { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    ],
    disableDefaultUI: true,
    zoomControl: true,
};

const getPinColor = (status) => {
    if (status === 'pending') return '#ef4444'; // Red
    if (status === 'cleaned') return '#22c55e'; // Green
    return '#3498db'; // Default blue for other statuses
};

const MapComponent = ({ reports, pendingRoute = [] }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(BANSWARA_COORDS);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const currentUserLocation = { lat: latitude, lng: longitude };
          setUserLocation(currentUserLocation);
          setMapCenter(currentUserLocation);
        },
        () => {
          // Fallback to Banswara if permission is denied
          setUserLocation(null);
          setMapCenter(BANSWARA_COORDS);
        }
      );
    }
  }, []);

  const handleMarkerClick = useCallback((report) => {
    setSelectedReport(report);
  }, []);

  const handleInfoWindowClose = useCallback(() => {
    setSelectedReport(null);
  }, []);

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} solutionChannel="GMP_devsite_samples_v3_rgma-ref-sol">
      <Map
        mapId={'DEMO_MAP_ID'}
        style={containerStyle}
        center={mapCenter}
        defaultZoom={14} // Zoom in a bit more for a local view
        gestureHandling={'greedy'}
        options={mapOptions}
        onClick={handleInfoWindowClose}
      >
        {/* Waste Reports Markers */}
        {reports.map((report) => (
          <AdvancedMarker key={report.id} position={report.location} onClick={() => handleMarkerClick(report)}>
            <Pin background={getPinColor(report.status)} borderColor={'#fff'} glyphColor={'#fff'} scale={1.2} />
          </AdvancedMarker>
        ))}

        {/* User's Location Marker */}
        {userLocation && (
            <AdvancedMarker position={userLocation} title={"You are here"}>
                <Pin background={'#007BFF'} borderColor={'#fff'} glyphColor={'#fff'} />
            </AdvancedMarker>
        )}

        {/* Route Optimization Polyline */}
        {pendingRoute.length > 0 && (
          <Polyline path={pendingRoute} strokeColor="#0000FF" strokeOpacity={0.8} strokeWeight={3} />
        )}

        {/* InfoWindow for Selected Report */}
        {selectedReport && (
          <InfoWindow position={selectedReport.location} onCloseClick={handleInfoWindowClose}>
            <div className='p-1 bg-slate-900 text-white rounded-lg shadow-xl font-sans max-w-xs'>
               {selectedReport.imageUrl && <img src={selectedReport.imageUrl} alt={selectedReport.wasteType} className="w-full h-32 object-cover rounded-t-md mb-2"/>}
               <div className="p-2">
                  <p><span className={`px-2 py-1 text-xs font-semibold rounded-full ${ selectedReport.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300' }`}>{selectedReport.status}</span></p>
                  <p className='mt-2 text-xs text-slate-400'>Reported: {new Date(selectedReport.createdAt?.toDate()).toLocaleString()}</p>
               </div>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default MapComponent;