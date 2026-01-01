'use client';
import { useEffect, useState } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

const Polyline = (props) => {
    const map = useMap();
    const [polyline, setPolyline] = useState(null);

    useEffect(() => {
        if (!map) return;

        if (polyline) {
            polyline.setMap(null);
        }

        const newPolyline = new google.maps.Polyline(props);
        newPolyline.setMap(map);
        setPolyline(newPolyline);

        return () => {
            if (newPolyline) {
                newPolyline.setMap(null);
            }
        };
    }, [map, props.path]); // Re-render when map or path changes

    return null; // This component does not render anything itself
};

export default Polyline;
