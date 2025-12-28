'use client';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback } from 'react';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 24.5854,
  lng: 73.7124,
};

// A professional "Smart City" map style (Silver Theme)
const mapOptions = {
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
    { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

const getMarkerIcon = (wasteType) => {
  let color = '#3498db'; // Default blue
  if (wasteType === 'Organic') color = '#2ecc71'; // Green
  if (wasteType === 'Plastic') color = '#e74c3c'; // Red
  if (wasteType === 'Metal') color = '#95a5a6'; // Gray

  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 0.9,
    scale: 8,
    strokeColor: 'white',
    strokeWeight: 2,
  };
};

const Map = ({ reports }) => {
  const [selectedReport, setSelectedReport] = useState(null);
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const onMapLoad = useCallback(() => {
    // You can use the map instance here if needed
  }, []);

  if (loadError) {
    return <div>Error loading map</div>;
  }

  if (!isLoaded) {
    return <div className='h-full flex items-center justify-center text-slate-400'>Loading Smart Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={mapOptions}
      onLoad={onMapLoad}
      onClick={() => setSelectedReport(null)}
    >
      {reports.map(report => (
        <Marker
          key={report.id}
          position={report.location}
          icon={getMarkerIcon(report.wasteType)}
          onClick={() => setSelectedReport(report)}
        />
      ))}

      {selectedReport && (
        <InfoWindow
          position={selectedReport.location}
          onCloseClick={() => setSelectedReport(null)}
        >
          <div className='p-1 bg-slate-900 text-white rounded-lg shadow-xl font-sans max-w-xs'>
             {selectedReport.imageUrl && <img src={selectedReport.imageUrl} alt={selectedReport.wasteType} className="w-full h-32 object-cover rounded-t-md mb-2"/>}
             <div className="p-2">
                <p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedReport.wasteType === 'Organic' ? 'bg-green-500/20 text-green-300' :
                        selectedReport.wasteType === 'Plastic' ? 'bg-red-500/20 text-red-300' :
                        'bg-blue-500/20 text-blue-300'
                    }`}>
                        {selectedReport.wasteType}
                    </span>
                </p>
                <p className='mt-2 text-xs text-slate-400'>
                    Reported: {new Date(selectedReport.createdAt?.toDate()).toLocaleString()}
                </p>
             </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Map;